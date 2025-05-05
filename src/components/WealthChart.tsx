
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Entry, TimelineEntry } from '@/lib/types';

type WealthChartProps = {
  timelineData: TimelineEntry[];
  latestEntries: Entry[];
  currency: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const WealthChart = ({ timelineData, latestEntries, currency }: WealthChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const lineChartData = timelineData.map(timeline => ({
    date: new Date(timeline.date).toLocaleDateString(),
    amount: timeline.total_amount
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pieChartData = latestEntries.map((entry, index) => ({
    name: entry.notes || `Category ${index + 1}`,
    value: entry.amount
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Wealth Growth</CardTitle>
          <CardDescription>Track your wealth over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#0EA5E9" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wealth Distribution</CardTitle>
          <CardDescription>Breakdown by category</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default WealthChart;
