
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { 
  SalesOpportunity, 
  CreateSalesOpportunityInput, 
  DashboardMetrics, 
  PipelineStageData, 
  PersonaType,
  User,
  SalesOpportunityStage,
  OpportunityFilters
} from '../../server/src/schema';
import { Search, Plus, TrendingUp, TrendingDown, Users, DollarSign, Calendar, Activity, BarChart3, Target, Award, Building2 } from 'lucide-react';

function App() {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('IC');
  const [searchTerm, setSearchTerm] = useState('');
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineStageData[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser] = useState<User>({ 
    id: 'user1', 
    name: 'Sarah Johnson', 
    email: 'sarah@company.com', 
    role: 'Front Line Manager',
    created_at: new Date()
  });

  // Form state for creating opportunities
  const [formData, setFormData] = useState<CreateSalesOpportunityInput>({
    name: '',
    stage: 'Prospecting',
    amount: 0,
    close_date: new Date(),
    assigned_to_id: '',
    customer_name: '',
    last_activity_date: new Date(),
    deal_probability: 50
  });

  // Filter state
  const [filters] = useState<OpportunityFilters>({});

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load users
      const usersResult = await trpc.getUsers.query();
      setUsers(usersResult);

      // Load opportunities with current filters
      const opportunitiesResult = await trpc.getSalesOpportunities.query(filters);
      setOpportunities(opportunitiesResult);

      // Load metrics for selected persona
      const metricsResult = await trpc.getDashboardMetrics.query({
        userId: currentUser.id,
        persona: selectedPersona
      });
      setMetrics(metricsResult);

      // Load pipeline data
      const pipelineResult = await trpc.getPipelineStageData.query({
        userId: currentUser.id,
        persona: selectedPersona
      });
      setPipelineData(pipelineResult);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, selectedPersona, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle opportunity creation
  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newOpportunity = await trpc.createSalesOpportunity.mutate(formData);
      setOpportunities((prev: SalesOpportunity[]) => [...prev, newOpportunity]);
      setIsCreateDialogOpen(false);
      // Reset form
      setFormData({
        name: '',
        stage: 'Prospecting',
        amount: 0,
        close_date: new Date(),
        assigned_to_id: '',
        customer_name: '',
        last_activity_date: new Date(),
        deal_probability: 50
      });
      // Reload metrics
      loadData();
    } catch (error) {
      console.error('Failed to create opportunity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opportunity deletion
  const handleDeleteOpportunity = async (id: string) => {
    try {
      await trpc.deleteSalesOpportunity.mutate({ id });
      setOpportunities((prev: SalesOpportunity[]) => prev.filter(opp => opp.id !== id));
      loadData(); // Reload metrics
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
    }
  };

  // Filter opportunities based on search and persona
  const filteredOpportunities = opportunities.filter((opp: SalesOpportunity) => {
    const matchesSearch = opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Persona-specific filtering (placeholder logic - would need actual team data)
    if (selectedPersona === 'IC') {
      return matchesSearch && opp.assigned_to_id === currentUser.id;
    } else if (selectedPersona === 'Manager') {
      return matchesSearch; // Would filter by team members
    }
    return matchesSearch; // Executive sees all
  });

  // Get stage badge color
  const getStageColor = (stage: SalesOpportunityStage) => {
    switch (stage) {
      case 'Prospecting': return 'bg-gray-500';
      case 'Qualification': return 'bg-blue-500';
      case 'Proposal': return 'bg-yellow-500';
      case 'Negotiation': return 'bg-orange-500';
      case 'Closed Won': return 'bg-green-500';
      case 'Closed Lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get persona-specific content
  const getPersonaContent = () => {
    if (!metrics) return null;

    switch (selectedPersona) {
      case 'IC':
        return {
          title: 'Individual Contributor Dashboard',
          heroMetrics: [
            { label: 'My Pipeline Value', value: `$${metrics.pipeline_value.toLocaleString()}`, icon: DollarSign, trend: 'up' },
            { label: 'Opportunities Won', value: metrics.opportunities_won.toString(), icon: Award, trend: 'up' },
            { label: 'Activities Completed', value: metrics.activities_completed.toString(), icon: Activity, trend: 'neutral' },
            { label: 'My Win Rate', value: `${metrics.win_rate.toFixed(1)}%`, icon: Target, trend: 'up' }
          ],
          summaryCards: [
            { label: 'Open Opportunities', value: metrics.open_opportunities },
            { label: 'Closed Won This Month', value: metrics.closed_won_this_month },
            { label: 'Forecasted Revenue', value: `$${metrics.forecasted_revenue.toLocaleString()}` },
            { label: 'Upcoming Activities', value: metrics.upcoming_activities }
          ]
        };
      case 'Manager':
        return {
          title: 'Front Line Manager Dashboard',
          heroMetrics: [
            { label: 'Team Pipeline Value', value: `$${metrics.pipeline_value.toLocaleString()}`, icon: DollarSign, trend: 'up' },
            { label: 'Team Opportunities Won', value: metrics.opportunities_won.toString(), icon: Award, trend: 'up' },
            { label: 'Team Activities', value: metrics.activities_completed.toString(), icon: Activity, trend: 'neutral' },
            { label: 'Team Win Rate', value: `${metrics.win_rate.toFixed(1)}%`, icon: Target, trend: 'up' }
          ],
          summaryCards: [
            { label: 'Team Open Opportunities', value: metrics.open_opportunities },
            { label: 'Team Closed Won', value: metrics.closed_won_this_month },
            { label: 'Team Revenue Forecast', value: `$${metrics.forecasted_revenue.toLocaleString()}` },
            { label: 'Team Performance vs Target', value: '112%' }
          ]
        };
      case 'Executive':
        return {
          title: 'Executive Dashboard',
          heroMetrics: [
            { label: 'Total Pipeline Value', value: `$${metrics.pipeline_value.toLocaleString()}`, icon: DollarSign, trend: 'up' },
            { label: 'Revenue Won (Quarter)', value: `$${metrics.opportunities_won.toLocaleString()}`, icon: TrendingUp, trend: 'up' },
            { label: 'Company Win Rate', value: `${metrics.win_rate.toFixed(1)}%`, icon: Target, trend: 'neutral' },
            { label: 'Avg Deal Cycle', value: '32 days', icon: Calendar, trend: 'down' }
          ],
          summaryCards: [
            { label: 'Total Open Opportunities', value: metrics.open_opportunities },
            { label: 'Total Closed Won YTD', value: metrics.closed_won_this_month },
            { label: 'Overall Revenue Forecast', value: `$${metrics.forecasted_revenue.toLocaleString()}` },
            { label: 'Top 5 Deals Pipeline', value: '$2.1M' }
          ]
        };
      default:
        return null;
    }
  };

  const personaContent = getPersonaContent();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SalesOps</span>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              {['overview', 'opportunities', 'customers', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium capitalize transition-colors ${
                    activeTab === tab 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-2' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Search, Actions, and User */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search opportunities, customers..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Opportunity
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleCreateOpportunity}>
                  <DialogHeader>
                    <DialogTitle>Create New Opportunity</DialogTitle>
                    <DialogDescription>
                      Add a new sales opportunity to track in your pipeline.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Opportunity Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateSalesOpportunityInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customer_name">Customer Name</Label>
                      <Input
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateSalesOpportunityInput) => ({ ...prev, customer_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={formData.amount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateSalesOpportunityInput) => ({ 
                              ...prev, 
                              amount: parseFloat(e.target.value) || 0 
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="stage">Stage</Label>
                        <Select 
                          value={formData.stage} 
                          onValueChange={(value: SalesOpportunityStage) =>
                            setFormData((prev: CreateSalesOpportunityInput) => ({ ...prev, stage: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Prospecting">Prospecting</SelectItem>
                            <SelectItem value="Qualification">Qualification</SelectItem>
                            <SelectItem value="Proposal">Proposal</SelectItem>
                            <SelectItem value="Negotiation">Negotiation</SelectItem>
                            <SelectItem value="Closed Won">Closed Won</SelectItem>
                            <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="close_date">Close Date</Label>
                        <Input
                          id="close_date"
                          type="date"
                          value={formData.close_date.toISOString().split('T')[0]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateSalesOpportunityInput) => ({ 
                              ...prev, 
                              close_date: new Date(e.target.value) 
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="deal_probability">Deal Probability (%)</Label>
                        <Input
                          id="deal_probability"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.deal_probability}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateSalesOpportunityInput) => ({ 
                              ...prev, 
                              deal_probability: parseInt(e.target.value) || 0 
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assigned_to_id">Assigned To</Label>
                      <Select 
                        value={formData.assigned_to_id || ''} 
                        onValueChange={(value: string) =>
                          setFormData((prev: CreateSalesOpportunityInput) => ({ ...prev, assigned_to_id: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user: User) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Opportunity'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatar.jpg" alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Persona Selector */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {personaContent?.title || 'Sales Dashboard'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {selectedPersona === 'IC' && 'Your personal sales performance and pipeline'}
                  {selectedPersona === 'Manager' && 'Team performance metrics and insights'}
                  {selectedPersona === 'Executive' && 'Company-wide sales performance overview'}
                </p>
              </div>
              
              <Select value={selectedPersona || 'IC'} onValueChange={(value: PersonaType) => setSelectedPersona(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IC">IC View</SelectItem>
                  <SelectItem value="Manager">Manager View</SelectItem>
                  <SelectItem value="Executive">Executive View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hero Metrics */}
            {personaContent && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {personaContent.heroMetrics.map((metric, index) => (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <metric.icon className="h-8 w-8 text-blue-600" />
                          {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mt-1" />}
                          {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mt-1" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Summary Cards */}
            {personaContent && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {personaContent.summaryCards.map((card, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">{card.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{card.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pipeline Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Pipeline by Stage
                </CardTitle>
                <CardDescription>
                  Opportunities distribution across sales stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineData.length > 0 ? (
                  <div className="space-y-4">
                    {pipelineData.map((stage: PipelineStageData, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge className={getStageColor(stage.stage)}>
                            {stage.stage}
                          </Badge>
                          <span className="font-medium">{stage.count} opportunities</span>
                        </div>
                        <span className="text-lg font-bold">${stage.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Pipeline data will appear here</p>
                    <p className="text-sm">Create some opportunities to see visualizations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opportunities Table */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Opportunities</CardTitle>
                <CardDescription>
                  {selectedPersona === 'IC' && 'Your assigned opportunities'}
                  {selectedPersona === 'Manager' && 'Team opportunities'}
                  {selectedPersona === 'Executive' && 'All company opportunities'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredOpportunities.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Opportunity Name</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Close Date</TableHead>
                        <TableHead>Probability</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOpportunities.map((opportunity: SalesOpportunity) => {
                        const assignedUser = users.find((user: User) => user.id === opportunity.assigned_to_id);
                        return (
                          <TableRow key={opportunity.id}>
                            <TableCell className="font-medium">{opportunity.name}</TableCell>
                            <TableCell>{opportunity.customer_name}</TableCell>
                            <TableCell>
                              <Badge className={getStageColor(opportunity.stage)}>
                                {opportunity.stage}
                              </Badge>
                            </TableCell>
                            <TableCell>${opportunity.amount.toLocaleString()}</TableCell>
                            <TableCell>{opportunity.close_date.toLocaleDateString()}</TableCell>
                            <TableCell>{opportunity.deal_probability}%</TableCell>
                            <TableCell>{assignedUser?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{opportunity.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteOpportunity(opportunity.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first opportunity.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Opportunity
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Dashboards Links */}
            <Card>
              <CardHeader>
                <CardTitle>Related Insights</CardTitle>
                <CardDescription>Dive deeper into your sales data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <BarChart3 className="h-5 w-5 mb-2" />
                    <span className="font-medium">Detailed Pipeline Analysis</span>
                    <span className="text-sm text-gray-500">Advanced pipeline metrics and forecasting</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <Users className="h-5 w-5 mb-2" />
                    <span className="font-medium">Customer Health Report</span>
                    <span className="text-sm text-gray-500">Customer engagement and satisfaction insights</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <TrendingUp className="h-5 w-5 mb-2" />
                    <span className="font-medium">Historical Performance</span>
                    <span className="text-sm text-gray-500">Trends and patterns over time</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs placeholder */}
        {activeTab !== 'overview' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 capitalize">{activeTab}</h2>
              <p className="text-gray-500 mb-8">This section is coming soon!</p>
              <Button onClick={() => setActiveTab('overview')} variant="outline">
                Back to Overview
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
