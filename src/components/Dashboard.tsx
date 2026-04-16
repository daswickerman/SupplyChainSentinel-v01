import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Factory, MapPin, AlertTriangle, Shield } from 'lucide-react';
import { Manufacturer, SupplyChainLocation, RiskReport } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardProps {
  manufacturers: Manufacturer[];
  locations: SupplyChainLocation[];
  reports: RiskReport[];
}

export function Dashboard({ manufacturers, locations, reports }: DashboardProps) {
  // Get unique technology types and assign stable colors
  const techTypes = Array.from(new Set(manufacturers.map(m => m.techType))).sort();
  const getTechColor = (techType: string) => {
    const colors = [
      '#3b82f6', // blue-500
      '#8b5cf6', // purple-500
      '#ec4899', // pink-500
      '#ef4444', // red-500
      '#f59e0b', // amber-500
      '#10b981', // emerald-500
      '#06b6d4', // cyan-500
      '#6366f1', // indigo-500
    ];
    const index = techTypes.indexOf(techType);
    return colors[index % colors.length];
  };

  const stats = [
    { label: 'Manufacturers', value: manufacturers.length, icon: Factory, color: 'bg-blue-500' },
    { label: 'Supply Chain Nodes', value: locations.length, icon: MapPin, color: 'bg-purple-500' },
    { label: 'High Risk Alerts', value: reports.filter(r => r.riskScore > 70).length, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Secure Entities', value: reports.filter(r => r.riskScore < 30).length, icon: Shield, color: 'bg-green-500' },
  ];

  // Data for charts
  const techTypeData = techTypes.map(type => ({
    name: type,
    value: manufacturers.filter(m => m.techType === type).length,
    fill: getTechColor(type)
  }));

  // Get only the most recent report for each manufacturer
  const latestReports = manufacturers.map(m => {
    const mReports = reports
      .filter(r => r.manufacturerId === m.id)
      .sort((a, b) => b.assessedAt - a.assessedAt);
    
    if (mReports.length === 0) return null;
    
    return {
      ...mReports[0],
      manufacturerName: m.name,
      techType: m.techType,
      fill: getTechColor(m.techType)
    };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-black/5 bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tech Distribution */}
        <Card className="border-none shadow-xl shadow-black/5 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Technology Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={techTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {techTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity / Risk Overview */}
        <Card className="border-none shadow-xl shadow-black/5 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Risk Distribution (Latest per Manufacturer)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latestReports}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="manufacturerName" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value}%`, 
                    `Risk (${props.payload.techType})`
                  ]}
                />
                <Bar dataKey="riskScore" radius={[6, 6, 0, 0]} barSize={40}>
                  {latestReports.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
