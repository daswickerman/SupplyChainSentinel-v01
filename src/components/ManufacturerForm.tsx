import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Manufacturer } from '@/types';

interface ManufacturerFormProps {
  onSubmit: (data: any) => Promise<void>;
  existingTechTypes?: string[];
  initialData?: Manufacturer;
}

export function ManufacturerForm({ onSubmit, existingTechTypes = [], initialData }: ManufacturerFormProps) {
  const [loading, setLoading] = useState(false);
  const [isCustomTech, setIsCustomTech] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    headquarters: initialData?.headquarters || '',
    techType: initialData?.techType || '',
    description: initialData?.description || '',
  });

  const defaultTechTypes = [
    "Semiconductors",
    "Networking Equipment",
    "Consumer Electronics",
    "Industrial IoT",
    "Medical Devices",
    "Aerospace & Defense"
  ];

  const allTechTypes = Array.from(new Set([...defaultTechTypes, ...existingTechTypes]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', headquarters: '', techType: '', description: '' });
      setIsCustomTech(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-black/5 bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Register Manufacturer</CardTitle>
        <CardDescription>Add a new hardware technology provider to the registry.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                placeholder="e.g. GlobalTech Systems"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="rounded-xl border-gray-200 focus:ring-black"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headquarters">Headquarters</Label>
              <Input
                id="headquarters"
                placeholder="e.g. San Jose, USA"
                value={formData.headquarters}
                onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                required
                className="rounded-xl border-gray-200 focus:ring-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="techType">Primary Technology Type</Label>
            {!isCustomTech ? (
              <div className="flex gap-2">
                <Select
                  value={formData.techType}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setIsCustomTech(true);
                      setFormData({ ...formData, techType: '' });
                    } else {
                      setFormData({ ...formData, techType: value });
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl border-gray-200 flex-1">
                    <SelectValue placeholder="Select technology category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTechTypes.map((type) => (
                      <SelectItem key={type} value={type} label={type} />
                    ))}
                    <Separator className="my-2" />
                    <SelectItem value="custom" className="text-blue-600 font-medium">
                      + Add New Type...
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="techType"
                  placeholder="Enter custom technology type..."
                  value={formData.techType}
                  onChange={(e) => setFormData({ ...formData, techType: e.target.value })}
                  required
                  autoFocus
                  className="rounded-xl border-gray-200 focus:ring-black flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCustomTech(false);
                    setFormData({ ...formData, techType: '' });
                  }}
                  className="rounded-xl border-gray-200"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Input
              id="description"
              placeholder="Brief overview of the manufacturer's focus..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-xl border-gray-200 focus:ring-black"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 text-white rounded-xl h-12 font-bold transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-5 h-5 mr-2" />
                Register Manufacturer
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
