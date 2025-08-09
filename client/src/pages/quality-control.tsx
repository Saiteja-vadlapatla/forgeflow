import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, CheckCircle, AlertCircle, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppHeader } from "@/components/layout/AppHeader";
import { SideNavigation } from "@/components/layout/SideNavigation";
import { QualityInspectionForm } from "@/components/quality/QualityInspectionForm";
import { QualityRecord } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function QualityControlPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState("all");
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const { toast } = useToast();

  const { data: qualityRecords = [], isLoading } = useQuery<QualityRecord[]>({
    queryKey: ["/api/quality/records"],
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["/api/work-orders"],
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["/api/machines"],
  });

  const filteredRecords = qualityRecords.filter((record) => {
    const matchesSearch = record.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.workOrderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResult = resultFilter === "all" || record.result === resultFilter;
    const matchesType = inspectionTypeFilter === "all" || record.inspectionType === inspectionTypeFilter;
    
    return matchesSearch && matchesResult && matchesType;
  });

  const getResultIcon = (result: string) => {
    switch (result) {
      case "pass": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "fail": return <XCircle className="h-4 w-4 text-red-600" />;
      case "rework": return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "hold": return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "pass": return "bg-green-100 text-green-800 border-green-200";
      case "fail": return "bg-red-100 text-red-800 border-red-200";
      case "rework": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hold": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getInspectionTypeLabel = (type: string) => {
    const labels = {
      first_article: "First Article",
      in_process: "In-Process",
      final: "Final",
      receiving: "Receiving"
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Quality metrics calculations
  const totalInspections = qualityRecords.length;
  const passRate = totalInspections > 0 ? 
    (qualityRecords.filter(r => r.result === "pass").length / totalInspections * 100).toFixed(1) : "0";
  const failRate = totalInspections > 0 ? 
    (qualityRecords.filter(r => r.result === "fail").length / totalInspections * 100).toFixed(1) : "0";
  const reworkRate = totalInspections > 0 ? 
    (qualityRecords.filter(r => r.result === "rework").length / totalInspections * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader isConnected={true} />
      
      <div className="flex">
        <SideNavigation />
        
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quality Control Center</h1>
            <p className="text-gray-600">Manage quality inspections and track manufacturing quality metrics</p>
          </div>

          {/* Quality Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pass Rate</p>
                    <p className="text-3xl font-bold text-green-600">{passRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Fail Rate</p>
                    <p className="text-3xl font-bold text-red-600">{failRate}%</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rework Rate</p>
                    <p className="text-3xl font-bold text-yellow-600">{reworkRate}%</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Inspections</p>
                    <p className="text-3xl font-bold text-blue-600">{totalInspections}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by part number or work order..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={resultFilter} onValueChange={setResultFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="rework">Rework</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={inspectionTypeFilter} onValueChange={setInspectionTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="first_article">First Article</SelectItem>
                    <SelectItem value="in_process">In-Process</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="receiving">Receiving</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={showInspectionDialog} onOpenChange={setShowInspectionDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      New Inspection
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Quality Inspection</DialogTitle>
                    </DialogHeader>
                    <QualityInspectionForm 
                      onSuccess={() => setShowInspectionDialog(false)}
                      workOrders={workOrders}
                      machines={machines}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Quality Records */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              filteredRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getResultIcon(record.result)}
                          <div>
                            <h3 className="font-semibold text-lg">
                              {record.partNumber}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Work Order: {record.workOrderId} | 
                              Type: {getInspectionTypeLabel(record.inspectionType)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Measurements */}
                          {record.measurements && typeof record.measurements === 'object' && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Key Measurements</h4>
                              <div className="space-y-1 text-sm">
                                {Object.entries(record.measurements as Record<string, any>).slice(0, 3).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-gray-600">{key}:</span>
                                    <span className="font-mono">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quality Parameters */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Quality Parameters</h4>
                            <div className="space-y-1 text-sm">
                              {record.surfaceFinish && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Surface Finish:</span>
                                  <span className="font-mono">Ra {record.surfaceFinish}μm</span>
                                </div>
                              )}
                              {record.hardness && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Hardness:</span>
                                  <span className="font-mono">{record.hardness} HRC</span>
                                </div>
                              )}
                              {record.concentricity && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Concentricity:</span>
                                  <span className="font-mono">±{record.concentricity}mm</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Inspector Info */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Inspection Details</h4>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="text-gray-600">Inspector:</span>
                                <span className="ml-2">{record.inspectorId}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Date:</span>
                                <span className="ml-2">
                                  {new Date(record.inspectionDate).toLocaleDateString()}
                                </span>
                              </div>
                              {record.serialNumber && (
                                <div>
                                  <span className="text-gray-600">Serial:</span>
                                  <span className="ml-2 font-mono">{record.serialNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Defects/Issues */}
                        {record.defectDescription && (
                          <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                            <h4 className="font-medium text-yellow-900 mb-1">Issue Description</h4>
                            <p className="text-sm text-yellow-800">{record.defectDescription}</p>
                            {record.defectType && (
                              <p className="text-xs text-yellow-700 mt-1">
                                Type: {record.defectType} | Location: {record.defectLocation}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Corrective Action */}
                        {record.correctiveAction && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-1">Corrective Action</h4>
                            <p className="text-sm text-blue-800">{record.correctiveAction}</p>
                            {record.dispositionCode && (
                              <p className="text-xs text-blue-700 mt-1">
                                Disposition: {record.dispositionCode}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 text-right">
                        <Badge className={`${getResultColor(record.result)} mb-2`}>
                          {record.result.toUpperCase()}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {new Date(record.inspectionDate).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredRecords.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <FileText className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quality records found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or create a new inspection.</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}