import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Manufacturer } from '@/types';
import { Factory, MapPin, Calendar } from 'lucide-react';

interface ManufacturerListProps {
  manufacturers: Manufacturer[];
  onSelect: (id: string) => void;
}

export function ManufacturerList({ manufacturers, onSelect }: ManufacturerListProps) {
  if (manufacturers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
        <Factory className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">No Manufacturers Registered</h3>
        <p className="text-gray-500">Start by adding a technology provider to the system.</p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-xl shadow-black/5 bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-bold">Manufacturer</TableHead>
            <TableHead className="font-bold">Category</TableHead>
            <TableHead className="font-bold">Headquarters</TableHead>
            <TableHead className="font-bold">Threat Actors</TableHead>
            <TableHead className="font-bold">Registered</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {manufacturers.map((m) => (
            <TableRow 
              key={m.id} 
              className="hover:bg-gray-50/50 transition-colors cursor-pointer"
              onClick={() => onSelect(m.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Factory className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{m.description}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none rounded-lg px-3 py-1">
                  {m.techType}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{m.headquarters}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {m.threatActors && m.threatActors.length > 0 ? (
                    m.threatActors.map((actor, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px] py-0 px-2 border-red-100 bg-red-50 text-red-700 rounded-md">
                        {actor}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">None identified</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-mono">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
