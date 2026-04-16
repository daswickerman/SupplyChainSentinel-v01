import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileJson, Loader2, Factory } from 'lucide-react';
import { toast } from 'sonner';
import { Manufacturer } from '@/types';

interface NodeImportDialogProps {
  manufacturers: Manufacturer[];
  onImport: (manufacturerId: string, nodes: any[]) => Promise<void>;
}

export function NodeImportDialog({ manufacturers, onImport }: NodeImportDialogProps) {
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedManufacturerId) {
      toast.error('Please select a manufacturer first');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast.error('Please upload a JSON file');
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          throw new Error('Import data must be an array of supply chain nodes');
        }
        
        await onImport(selectedManufacturerId, json);
        setOpen(false);
        setSelectedManufacturerId('');
      } catch (error) {
        console.error('Node Import Error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to parse import file');
      } finally {
        setImporting(false);
        // Reset input
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" />
            Import Nodes
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle>Import Supply Chain Nodes</DialogTitle>
          <DialogDescription>
            Select a manufacturer and upload a JSON file containing its supply chain nodes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Manufacturer</label>
            <Select value={selectedManufacturerId} onValueChange={setSelectedManufacturerId}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-12">
                <SelectValue placeholder="Select a manufacturer..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {manufacturers.map((m) => (
                  <SelectItem key={m.id} value={m.id} label={m.name} className="rounded-lg">
                    <Factory className="w-4 h-4 text-gray-400" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={`p-8 border-2 border-dashed rounded-3xl text-center transition-colors relative group ${
            !selectedManufacturerId ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'border-gray-200 hover:border-black cursor-pointer'
          }`}>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className={`absolute inset-0 w-full h-full opacity-0 ${!selectedManufacturerId ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={importing || !selectedManufacturerId}
            />
            <div className="flex flex-col items-center gap-3">
              {importing ? (
                <Loader2 className="w-12 h-12 text-black animate-spin" />
              ) : (
                <FileJson className={`w-12 h-12 transition-colors ${!selectedManufacturerId ? 'text-gray-200' : 'text-gray-300 group-hover:text-black'}`} />
              )}
              <div className="space-y-1">
                <p className={`font-bold ${!selectedManufacturerId ? 'text-gray-300' : 'text-gray-900'}`}>
                  {importing ? 'Processing Nodes...' : selectedManufacturerId ? 'Click or drag to upload' : 'Select manufacturer first'}
                </p>
                <p className="text-sm text-gray-500">JSON format only</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expected Node Format</h4>
            <pre className="text-[10px] font-mono text-gray-600 overflow-auto max-h-32 p-2">
{`[
  {
    "type": "Assembly",
    "country": "Taiwan",
    "location": "Hsinchu Science Park"
  },
  {
    "type": "Raw Materials",
    "country": "Australia",
    "location": "Lithium Mining"
  }
]`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
