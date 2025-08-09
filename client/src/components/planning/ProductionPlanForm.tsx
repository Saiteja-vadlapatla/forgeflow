import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { insertProductionPlanSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const productionPlanFormSchema = insertProductionPlanSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  totalWorkOrders: true,
  completedWorkOrders: true,
  efficiency: true,
});

type ProductionPlanFormData = z.infer<typeof productionPlanFormSchema>;

interface ProductionPlanFormProps {
  onSuccess: () => void;
}

export function ProductionPlanForm({ onSuccess }: ProductionPlanFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProductionPlanFormData>({
    resolver: zodResolver(productionPlanFormSchema),
    defaultValues: {
      planName: "",
      planType: "weekly",
      status: "draft",
      notes: "",
      createdBy: "current-user", // In real app, get from auth context
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductionPlanFormData) => {
      const response = await fetch("/api/production-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create production plan");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-plans"] });
      toast({
        title: "Success",
        description: "Production plan created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create production plan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductionPlanFormData) => {
    // Convert datetime-local strings to proper format for API
    const formData = {
      ...data,
      startDate: data.startDate,
      endDate: data.endDate,
    };
    
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="planName">Plan Name</Label>
              <Input
                id="planName"
                {...form.register("planName")}
                placeholder="Weekly Production Plan - Week 3"
                className="mt-1"
              />
              {form.formState.errors.planName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.planName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="planType">Plan Type</Label>
              <Select 
                value={form.watch("planType")} 
                onValueChange={(value) => form.setValue("planType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Plan</SelectItem>
                  <SelectItem value="weekly">Weekly Plan</SelectItem>
                  <SelectItem value="monthly">Monthly Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={form.watch("status")} 
                onValueChange={(value) => form.setValue("status", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                {...form.register("startDate")}
                className="mt-1"
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
                {...form.register("endDate")}
                className="mt-1"
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Plan objectives, special requirements, constraints..."
              className="mt-1 resize-none"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Plan"}
        </Button>
      </div>
    </form>
  );
}