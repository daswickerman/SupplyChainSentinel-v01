import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileJson, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImportDialogProps {
  onImport: (data: any[]) => Promise<void>;
}

export function ImportDialog({ onImport }: ImportDialogProps) {
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          throw new Error('Import data must be an array of manufacturers');
        }
        await onImport(json);
        toast.success(`Successfully imported ${json.length} entries`);
        setOpen(false);
      } catch (error) {
        console.error('Import Error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to parse import file');
      } finally {
        setImporting(false);
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
            Import Data
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle>Import Supply Chain Data</DialogTitle>
          <DialogDescription>
            Upload a JSON file containing manufacturers, locations, and threat actor links.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl text-center hover:border-black transition-colors relative group">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={importing}
            />
            <div className="flex flex-col items-center gap-3">
              {importing ? (
                <Loader2 className="w-12 h-12 text-black animate-spin" />
              ) : (
                <FileJson className="w-12 h-12 text-gray-300 group-hover:text-black transition-colors" />
              )}
              <div className="space-y-1">
                <p className="font-bold text-gray-900">
                  {importing ? 'Processing Data...' : 'Click or drag to upload'}
                </p>
                <p className="text-sm text-gray-500">JSON format only</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expected Format</h4>
            <pre className="text-[10px] font-mono text-gray-600 overflow-auto max-h-32 p-2">
{`[
  {
    "name": "Manufacturer Name",
    "headquarters": "HQ Address",
    "techType": "Semiconductors",
    "locations": [
      { "type": "Assembly", "country": "Taiwan", "location": "Hsinchu" }
    ],
    "threatActors": ["APT41"]
  }
]`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
