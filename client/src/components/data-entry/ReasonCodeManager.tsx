import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { insertReasonCodeSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Plus, Edit, Trash, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const reasonCodeFormSchema = insertReasonCodeSchema.extend({
  code: z.string().min(2, "Code must be at least 2 characters").max(10, "Code must be 10 characters or less"),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

type ReasonCodeFormData = z.infer<typeof reasonCodeFormSchema>;

interface ReasonCodeManagerProps {
  className?: string;
}

export function ReasonCodeManager({ className }: ReasonCodeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reason codes
  const { data: reasonCodes = [] } = useQuery({
    queryKey: ["/api/data-entry/reason-codes"],
  });

  const form = useForm<ReasonCodeFormData>({
    resolver: zodResolver(reasonCodeFormSchema),
    defaultValues: {
      code: "",
      category: "downtime",
      subcategory: "",
      description: "",
      requiresComment: false,
      isActive: true,
      severity: "medium",
      impactType: "availability",
      createdBy: "current-user", // This would come from auth context
    },
  });

  // Create/Update reason code mutation
  const saveReasonCodeMutation = useMutation({
    mutationFn: async (data: ReasonCodeFormData) => {
      const endpoint = editingCode ? `reason-codes/${editingCode.id}` : "reason-codes";
      const method = editingCode ? "PATCH" : "POST";
      
      return apiRequest(`data-entry/${endpoint}`, {
        method,
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-entry/reason-codes"] });
      toast({
        title: editingCode ? "Code Updated" : "Code Created",
        description: `Reason code has been ${editingCode ? "updated" : "created"} successfully.`,
      });
      form.reset();
      setEditingCode(null);
      setIsOpen(false);
    },
  });

  // Delete reason code mutation
  const deleteReasonCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      return apiRequest(`data-entry/reason-codes/${codeId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-entry/reason-codes"] });
      toast({
        title: "Code Deleted",
        description: "Reason code has been deleted successfully.",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ codeId, isActive }: { codeId: string; isActive: boolean }) => {
      return apiRequest(`data-entry/reason-codes/${codeId}`, {
        method: "PATCH",
        body: { isActive },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-entry/reason-codes"] });
    },
  });

  const onSubmit = (data: ReasonCodeFormData) => {
    saveReasonCodeMutation.mutate(data);
  };

  const handleEdit = (code: any) => {
    setEditingCode(code);
    form.reset({
      code: code.code,
      category: code.category,
      subcategory: code.subcategory || "",
      description: code.description,
      requiresComment: code.requiresComment,
      isActive: code.isActive,
      severity: code.severity,
      impactType: code.impactType,
    });
    setIsOpen(true);
  };

  const handleDelete = async (codeId: string) => {
    if (confirm("Are you sure you want to delete this reason code?")) {
      deleteReasonCodeMutation.mutate(codeId);
    }
  };

  const filteredCodes = reasonCodes.filter((code: any) => 
    selectedCategory === "all" || code.category === selectedCategory
  );

  const categories = ["downtime", "scrap", "quality", "setup"];
  const subcategories = {
    downtime: ["mechanical", "electrical", "tooling", "material", "operator", "maintenance"],
    scrap: ["dimensional", "surface", "material", "contamination", "handling"],
    quality: ["measurement", "inspection", "calibration", "documentation"],
    setup: ["changeover", "programming", "tooling", "material_prep"]
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "downtime": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "scrap": return <XCircle className="h-4 w-4 text-orange-500" />;
      case "quality": return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "setup": return <Clock className="h-4 w-4 text-purple-500" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Reason Code Management</span>
              <Badge variant="outline">{reasonCodes.length} codes</Badge>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-code">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>{editingCode ? "Edit Reason Code" : "Create New Reason Code"}</span>
                  </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., BRK, MAT, QUA"
                                className="uppercase"
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                data-testid="input-code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value} data-testid="select-category">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      <div className="flex items-center space-x-2">
                                        {getCategoryIcon(cat)}
                                        <span className="capitalize">{cat}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="subcategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subcategory (Optional)</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value} data-testid="select-subcategory">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subcategory" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(subcategories[form.watch("category") as keyof typeof subcategories] || []).map((sub) => (
                                    <SelectItem key={sub} value={sub}>
                                      <span className="capitalize">{sub.replace("_", " ")}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="severity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Severity</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value} data-testid="select-severity">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Clear description of when to use this code..."
                              rows={3}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="impactType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Impact Type</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value} data-testid="select-impact">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select impact type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="availability">Availability</SelectItem>
                                  <SelectItem value="performance">Performance</SelectItem>
                                  <SelectItem value="quality">Quality</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-6 pt-8">
                        <FormField
                          control={form.control}
                          name="requiresComment"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-requires-comment"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Requires Comment</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-is-active"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Active</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsOpen(false);
                          setEditingCode(null);
                          form.reset();
                        }}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={saveReasonCodeMutation.isPending}
                        data-testid="button-save"
                      >
                        {saveReasonCodeMutation.isPending ? (
                          "Saving..."
                        ) : (
                          <>
                            {editingCode ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            {editingCode ? "Update Code" : "Create Code"}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage reason codes for downtime events, scrap reporting, and quality issues. 
            These codes help categorize and analyze production disruptions.
          </p>
        </CardContent>
      </Card>

      {/* Category Filter Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="downtime" data-testid="tab-downtime">Downtime</TabsTrigger>
          <TabsTrigger value="scrap" data-testid="tab-scrap">Scrap</TabsTrigger>
          <TabsTrigger value="quality" data-testid="tab-quality">Quality</TabsTrigger>
          <TabsTrigger value="setup" data-testid="tab-setup">Setup</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory}>
          <div className="grid gap-4">
            {filteredCodes.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No reason codes found</p>
                    <p className="text-sm">Create your first reason code to get started</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredCodes.map((code: any) => (
                <Card 
                  key={code.id} 
                  data-testid={`reason-code-${code.id}`}
                  className={cn(!code.isActive && "opacity-60")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getCategoryIcon(code.category)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-mono">
                              {code.code}
                            </Badge>
                            <Badge variant={getSeverityColor(code.severity)}>
                              {code.severity}
                            </Badge>
                            {!code.isActive && <Badge variant="secondary">Inactive</Badge>}
                            {code.requiresComment && <Badge variant="outline">Comment Required</Badge>}
                          </div>
                          <p className="font-medium mt-1">{code.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                            <span className="capitalize">{code.category}</span>
                            {code.subcategory && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{code.subcategory.replace("_", " ")}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="capitalize">{code.impactType} impact</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={code.isActive}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ codeId: code.id, isActive: checked })
                          }
                          data-testid={`switch-active-${code.id}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(code)}
                          data-testid={`button-edit-${code.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(code.id)}
                          disabled={deleteReasonCodeMutation.isPending}
                          data-testid={`button-delete-${code.id}`}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}