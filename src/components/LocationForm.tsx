import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2 } from 'lucide-react';
import { Manufacturer } from '@/types';

interface LocationFormProps {
  manufacturers: Manufacturer[];
  onSubmit: (data: any) => Promise<void>;
}

export function LocationForm({ manufacturers, onSubmit }: LocationFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    manufacturerId: '',
    type: 'Assembly',
    country: '',
    details: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.manufacturerId) return;
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ ...formData, country: '', details: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-black/5 bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Add Supply Chain Node</CardTitle>
        <CardDescription>Register a specific location in a manufacturer's supply chain.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Select
              value={formData.manufacturerId}
              onValueChange={(value) => setFormData({ ...formData, manufacturerId: value })}
            >
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Select manufacturer" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((m) => (
                  <SelectItem key={m.id} value={m.id} label={m.name} />
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Node Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assembly">Assembly</SelectItem>
                  <SelectItem value="Component Sourcing">Component Sourcing</SelectItem>
                  <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                  <SelectItem value="R&D">R&D</SelectItem>
                  <SelectItem value="Distribution">Distribution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country / Region</Label>
              <Input
                id="country"
                placeholder="e.g. Taiwan, Vietnam, Germany"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
                className="rounded-xl border-gray-200 focus:ring-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Specific Details</Label>
            <Input
              id="details"
              placeholder="e.g. Hsinchu Science Park, Fab 12"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="rounded-xl border-gray-200 focus:ring-black"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading || !formData.manufacturerId}
            className="w-full bg-black hover:bg-gray-800 text-white rounded-xl h-12 font-bold transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MapPin className="w-5 h-5 mr-2" />
                Add Location
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
