import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Manufacturer, SupplyChainLocation, RiskReport } from '@/types';
import { Factory, MapPin, History, Edit, ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { ManufacturerForm } from './ManufacturerForm';
import { RiskAnalysis } from './RiskAnalysis';
import { cn } from '@/lib/utils';

interface ManufacturerDetailProps {
  manufacturer: Manufacturer;
  locations: SupplyChainLocation[];
  reports: RiskReport[];
  onBack: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
}

export function ManufacturerDetail({ manufacturer, locations, reports, onBack, onUpdate }: ManufacturerDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  );

  const mLocations = locations.filter(l => l.manufacturerId === manufacturer.id);
  const mReports = reports
    .filter(r => r.manufacturerId === manufacturer.id)
    .sort((a, b) => b.assessedAt - a.assessedAt);

  const selectedReport = mReports.find(r => r.id === selectedReportId) || mReports[0] || null;

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setIsEditing(false)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
        <ManufacturerForm 
          onSubmit={async (data) => {
            await onUpdate(manufacturer.id, data);
            setIsEditing(false);
          }} 
          initialData={manufacturer}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl border-gray-200">
          <Edit className="w-4 h-4 mr-2" />
          Edit Details
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl shadow-black/5 bg-white overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-gray-900 to-gray-700" />
            <CardContent className="relative pt-12">
              <div className="absolute -top-10 left-6 w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <Factory className="w-10 h-10 text-gray-900" />
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{manufacturer.name}</h2>
                  <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-700 border-none">
                    {manufacturer.techType}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {manufacturer.description || "No description provided."}
                </p>
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{manufacturer.headquarters}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <History className="w-4 h-4" />
                    <span>Joined {new Date(manufacturer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-black/5 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Supply Chain Nodes</CardTitle>
              <CardDescription>{mLocations.length} locations identified</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mLocations.map((loc) => (
                  <div key={loc.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                      <MapPin className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{loc.country}</p>
                      <p className="text-xs text-gray-500">{loc.type}</p>
                      {loc.details && <p className="text-[10px] text-gray-400 mt-1">{loc.details}</p>}
                    </div>
                  </div>
                ))}
                {mLocations.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center py-4">No nodes registered.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Section */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="latest" className="w-full">
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <TabsTrigger value="latest" className="rounded-xl px-6">Latest Assessment</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl px-6">Historical Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="latest" className="mt-0">
              <RiskAnalysis report={mReports[0] || null} manufacturerName={manufacturer.name} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="space-y-4">
                {mReports.length > 0 ? (
                  mReports.map((report) => (
                    <Card 
                      key={report.id} 
                      className={cn(
                        "border-none shadow-lg shadow-black/5 bg-white cursor-pointer transition-all hover:scale-[1.01]",
                        selectedReportId === report.id ? "ring-2 ring-black" : ""
                      )}
                      onClick={() => {
                        setSelectedReportId(report.id);
                        // In a real app we might scroll to top or open a modal
                      }}
                    >
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg",
                            report.riskScore < 30 ? "bg-green-100 text-green-700" : 
                            report.riskScore < 60 ? "bg-yellow-100 text-yellow-700" : 
                            "bg-red-100 text-red-700"
                          )}>
                            {report.riskScore}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {new Date(report.assessedAt).toLocaleDateString()} at {new Date(report.assessedAt).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-500">ID: {report.id}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-lg">View Details</Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Assessment History</h3>
                    <p className="text-gray-500">Run a risk analysis to start tracking assessments.</p>
                  </div>
                )}
              </div>

              {selectedReport && mReports.length > 1 && (
                <div className="mt-12 pt-12 border-t border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Historical Detail: {new Date(selectedReport.assessedAt).toLocaleDateString()}</h3>
                  <RiskAnalysis report={selectedReport} manufacturerName={manufacturer.name} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
