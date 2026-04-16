import * as React from 'react';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, User, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, addDoc, serverTimestamp, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { ManufacturerForm } from './components/ManufacturerForm';
import { ManufacturerList } from './components/ManufacturerList';
import { LocationForm } from './components/LocationForm';
import { LocationList } from './components/LocationList';
import { RiskAnalysis } from './components/RiskAnalysis';
import { ImportDialog } from './components/ImportDialog';
import { NodeImportDialog } from './components/NodeImportDialog';
import { assessSupplyChainRisk, identifyThreatActors } from './services/gemini';
import { ManufacturerDetail } from './components/ManufacturerDetail';
import { Manufacturer, SupplyChainLocation, RiskReport } from './types';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Shield, LogIn, LogOut, Loader2, AlertCircle, Play } from 'lucide-react';

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [locations, setLocations] = useState<SupplyChainLocation[]>([]);
  const [reports, setReports] = useState<RiskReport[]>([]);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState<RiskReport | null>(null);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string | null>(null);
  const [riskTabManufacturerId, setRiskTabManufacturerId] = useState<string>('');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    const mQuery = query(collection(db, 'manufacturers'), orderBy('createdAt', 'desc'));
    const lQuery = query(collection(db, 'locations'));
    const rQuery = query(collection(db, 'reports'), orderBy('assessedAt', 'desc'));

    const unsubM = onSnapshot(mQuery, (snapshot) => {
      setManufacturers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Manufacturer)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'manufacturers'));

    const unsubL = onSnapshot(lQuery, (snapshot) => {
      setLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyChainLocation)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'locations'));

    const unsubR = onSnapshot(rQuery, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RiskReport)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reports'));

    return () => {
      unsubM();
      unsubL();
      unsubR();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully authenticated');
    } catch (error) {
      toast.error('Authentication failed');
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.info('Logged out');
  };

  const addManufacturer = async (data: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'manufacturers'), {
        ...data,
        authorUid: user.uid,
        createdAt: Date.now()
      });
      toast.success('Manufacturer registered');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'manufacturers');
    }
  };

  const addLocation = async (data: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'locations'), {
        ...data,
        authorUid: user.uid
      });
      toast.success('Supply chain node added');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'locations');
    }
  };

  const updateManufacturer = async (id: string, data: any) => {
    if (!user) return;
    try {
      const { id: _, ...updateData } = data;
      await updateDoc(doc(db, 'manufacturers', id), {
        ...updateData,
        updatedAt: Date.now()
      });
      toast.success('Manufacturer details updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'manufacturers');
    }
  };

  const handleImport = async (data: any[]) => {
    if (!user) return;
    
    // Local cache to track changes during the import loop before state updates
    const sessionManufacturers = [...manufacturers];
    const sessionLocations = [...locations];
    let importedCount = 0;

    for (const mData of data) {
      if (!mData.name) continue;

      try {
        let manufacturerId = '';
        const existingManufacturer = sessionManufacturers.find(
          m => m.name.toLowerCase() === mData.name.toLowerCase()
        );

        if (existingManufacturer) {
          manufacturerId = existingManufacturer.id;
        } else {
          // 1. Identify Threat Actors if not provided
          let threatActors = mData.threatActors || [];
          if (threatActors.length === 0) {
            threatActors = await identifyThreatActors(
              mData.name,
              mData.locations || [],
              mData.headquarters || ''
            );
          }

          // 2. Add Manufacturer
          let mDoc;
          try {
            mDoc = await addDoc(collection(db, 'manufacturers'), {
              name: mData.name.trim(),
              headquarters: (mData.headquarters || '').trim(),
              techType: (mData.techType || 'Hardware').trim(),
              description: (mData.description || '').trim(),
              threatActors,
              authorUid: user.uid,
              createdAt: Date.now()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'manufacturers');
            throw error; // Ensure loop stops on permission error
          }
          manufacturerId = mDoc.id;
          
          // Update session cache
          sessionManufacturers.push({
            id: manufacturerId,
            name: mData.name,
            headquarters: mData.headquarters || '',
            techType: mData.techType || 'Hardware',
            description: mData.description || '',
            threatActors,
            authorUid: user.uid,
            createdAt: Date.now()
          } as Manufacturer);
        }

        // 3. Add Locations
        if (mData.locations && Array.isArray(mData.locations)) {
          const allowedTypes = ['Assembly', 'Component Sourcing', 'Raw Materials', 'R&D', 'Distribution'];
          for (const lData of mData.locations) {
            if (!lData.country) continue;

            const rawType = lData.type || 'Assembly';
            const type = allowedTypes.find(t => t.toLowerCase() === rawType.trim().toLowerCase()) || 'Assembly';

            // Check if this location already exists in session cache to avoid duplicates
            const locationDetails = (lData.location || lData.details || '').trim();
            const locationExists = sessionLocations.find(
              l => l.manufacturerId === manufacturerId && 
                   l.country.toLowerCase() === lData.country.toLowerCase() &&
                   l.type === type &&
                   l.details.toLowerCase() === locationDetails.toLowerCase()
            );

            if (!locationExists) {
              const newLocData = {
                manufacturerId,
                type,
                country: lData.country,
                details: locationDetails.slice(0, 200),
                authorUid: user.uid
              };
              
              try {
                const lDoc = await addDoc(collection(db, 'locations'), newLocData);
                sessionLocations.push({ id: lDoc.id, ...newLocData } as SupplyChainLocation);
              } catch (error) {
                handleFirestoreError(error, OperationType.CREATE, 'locations');
              }
            }
          }
        }
        importedCount++;
      } catch (error) {
        console.error(`Failed to import manufacturer ${mData.name}:`, error);
        // Only toast if it's not a firestore error (which was already handled/thrown)
        if (!(error instanceof Error && error.message.includes('authInfo'))) {
          toast.error(`Failed to import ${mData.name}`);
        } else {
          throw error; // Re-throw to let the system see the JSON error
        }
      }
    }
    
    if (importedCount > 0) {
      toast.success(`Successfully processed ${importedCount} manufacturers and their supply chain nodes`);
    }
  };

  const handleNodeImport = async (manufacturerId: string, nodes: any[]) => {
    if (!user) return;
    
    let importedCount = 0;
    const sessionLocations = [...locations];

    const allowedTypes = ['Assembly', 'Component Sourcing', 'Raw Materials', 'R&D', 'Distribution'];
    for (const lData of nodes) {
      if (!lData.country) continue;

      const rawType = lData.type || 'Assembly';
      const type = allowedTypes.find(t => t.toLowerCase() === rawType.trim().toLowerCase()) || 'Assembly';

      try {
        // Check if this location already exists to avoid duplicates
        const locationDetails = (lData.location || lData.details || '').trim();
        const locationExists = sessionLocations.find(
          l => l.manufacturerId === manufacturerId && 
               l.country.toLowerCase() === lData.country.toLowerCase() &&
               l.type === type &&
               l.details.toLowerCase() === locationDetails.toLowerCase()
        );

        if (!locationExists) {
          const newLocData = {
            manufacturerId,
            type,
            country: lData.country,
            details: locationDetails.slice(0, 200),
            authorUid: user.uid
          };
          
          const lDoc = await addDoc(collection(db, 'locations'), newLocData);
          sessionLocations.push({ id: lDoc.id, ...newLocData } as SupplyChainLocation);
          importedCount++;
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'locations');
        throw error; // Stop loop on permission error
      }
    }

    if (importedCount > 0) {
      toast.success(`Successfully imported ${importedCount} nodes for the selected manufacturer`);
    } else {
      toast.info('No new nodes were imported (duplicates skipped or invalid data)');
    }
  };

  const runAnalysis = async (manufacturerId: string) => {
    const manufacturer = manufacturers.find(m => m.id === manufacturerId);
    if (!manufacturer || !user) return;

    setAnalyzing(true);
    setActiveTab('risks');
    try {
      const mLocations = locations.filter(l => l.manufacturerId === manufacturerId);
      const assessment = await assessSupplyChainRisk(
        manufacturer.name,
        mLocations,
        manufacturer.techType
      );

      const reportData = {
        manufacturerId,
        ...assessment,
        threatActorLinks: manufacturer.threatActors || [],
        assessedAt: Date.now(),
        authorUid: user.uid
      };

      try {
        const docRef = await addDoc(collection(db, 'reports'), reportData);
        setCurrentReport({ id: docRef.id, ...reportData });
        toast.success('Risk assessment complete');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'reports');
      }
    } catch (error) {
      toast.error('Analysis failed');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 p-12 text-center border border-white">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-black/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Sentinel</h1>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Secure hardware supply chain monitoring and risk assessment platform.
          </p>
          <Button 
            onClick={handleLogin}
            className="w-full bg-black hover:bg-gray-800 text-white rounded-2xl h-14 font-bold text-lg transition-all flex items-center justify-center gap-3"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </Button>
          <p className="mt-8 text-xs text-gray-400 font-medium uppercase tracking-widest">
            Enterprise Grade Security
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <Toaster position="top-right" richColors closeButton />
        
        {activeTab === 'dashboard' && (
          <Dashboard 
            manufacturers={manufacturers} 
            locations={locations} 
            reports={reports} 
          />
        )}

        {activeTab === 'manufacturers' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            {selectedManufacturerId ? (
              <ManufacturerDetail 
                manufacturer={manufacturers.find(m => m.id === selectedManufacturerId)!}
                locations={locations}
                reports={reports}
                onBack={() => setSelectedManufacturerId(null)}
                onUpdate={updateManufacturer}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Manufacturer Management</h3>
                  <ImportDialog onImport={handleImport} />
                </div>
                <ManufacturerForm 
                  onSubmit={addManufacturer} 
                  existingTechTypes={Array.from(new Set(manufacturers.map(m => m.techType)))} 
                />
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">Registered Manufacturers</h3>
                  <ManufacturerList 
                    manufacturers={manufacturers} 
                    onSelect={setSelectedManufacturerId}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Supply Chain Mapping</h3>
              <NodeImportDialog manufacturers={manufacturers} onImport={handleNodeImport} />
            </div>
            <LocationForm manufacturers={manufacturers} onSubmit={addLocation} />
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Supply Chain Map</h3>
              <LocationList locations={locations} manufacturers={manufacturers} />
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Risk Assessment Control</h3>
                  <p className="text-sm text-gray-500">Select a manufacturer to view their latest report or initiate a core analysis.</p>
                  
                  <Select 
                    value={riskTabManufacturerId} 
                    onValueChange={setRiskTabManufacturerId}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl border-gray-200 mt-4 focus:ring-black">
                      <SelectValue placeholder="Choose technology provider..." />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map(m => (
                        <SelectItem key={m.id} value={m.id} label={m.name}>
                          <Shield className="w-4 h-4 text-gray-400" />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="shrink-0 flex gap-3">
                  <Button
                    onClick={() => runAnalysis(riskTabManufacturerId)}
                    disabled={analyzing || !riskTabManufacturerId}
                    className="h-12 px-8 bg-black hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-black/10 disabled:opacity-50"
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Start New Analysis
                  </Button>
                </div>
              </div>
            </div>
            
            <RiskAnalysis 
              report={
                riskTabManufacturerId 
                  ? (reports.find(r => r.manufacturerId === riskTabManufacturerId) || null)
                  : null
              } 
              loading={analyzing}
              manufacturerName={manufacturers.find(m => m.id === riskTabManufacturerId)?.name}
            />
          </div>
        )}

        <div className="fixed bottom-8 right-8">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="bg-white/80 backdrop-blur-md border-gray-200 rounded-2xl shadow-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}
