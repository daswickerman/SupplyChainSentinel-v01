import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SupplyChainLocation, Manufacturer } from '@/types';
import { MapPin, Globe } from 'lucide-react';

interface LocationListProps {
  locations: SupplyChainLocation[];
  manufacturers: Manufacturer[];
}

export function LocationList({ locations, manufacturers }: LocationListProps) {
  if (locations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">No Supply Chain Nodes</h3>
        <p className="text-gray-500">Map out the supply chain by adding locations for manufacturers.</p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-xl shadow-black/5 bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-bold">Manufacturer</TableHead>
            <TableHead className="font-bold">Node Type</TableHead>
            <TableHead className="font-bold">Location</TableHead>
            <TableHead className="font-bold">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((l) => {
            const manufacturer = manufacturers.find(m => m.id === l.manufacturerId);
            return (
              <TableRow key={l.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-bold text-gray-900">
                  {manufacturer?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <Badge className="bg-black text-white hover:bg-gray-800 border-none rounded-lg px-3 py-1">
                    {l.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{l.country}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500 italic">
                  {l.details}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
