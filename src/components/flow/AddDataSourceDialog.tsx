
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";

interface AddDataSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (dataSource: {
    name: string;
    type: "source" | "target";
    connectionType: string;
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
  }) => void;
  type: "source" | "target";
}

interface FormData {
  name: string;
  connectionType: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

const connectionTypes = {
  source: ["MySQL", "PostgreSQL", "SQLite", "MongoDB", "Oracle"],
  target: ["MySQL", "PostgreSQL", "BigQuery", "Snowflake", "Redshift"]
};

const AddDataSourceDialog = ({ open, onOpenChange, onSubmit, type }: AddDataSourceDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>();

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onSubmit({
        ...data,
        type,
      });
      reset();
    } catch (error) {
      console.error("Error adding data source:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle>Add {type === "source" ? "Source" : "Target"} Database</DialogTitle>
            <DialogDescription>
              Configure your {type === "source" ? "source" : "target"} database connection details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                placeholder="e.g., Production MySQL Database"
                {...register("name", { required: "Connection name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="connectionType">Database Type</Label>
              <Controller
                name="connectionType"
                control={control}
                rules={{ required: "Database type is required" }}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectionTypes[type].map((dbType) => (
                        <SelectItem key={dbType} value={dbType}>
                          {dbType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.connectionType && (
                <p className="text-sm text-destructive">{errors.connectionType.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="host">Host / Endpoint</Label>
                <Input
                  id="host"
                  placeholder="e.g., localhost or db.example.com"
                  {...register("host", { required: "Host is required" })}
                />
                {errors.host && (
                  <p className="text-sm text-destructive">{errors.host.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  placeholder="e.g., 3306"
                  {...register("port")}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="database">Database Name</Label>
              <Input
                id="database"
                placeholder="e.g., my_database"
                {...register("database", { required: "Database name is required" })}
              />
              {errors.database && (
                <p className="text-sm text-destructive">{errors.database.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g., db_user"
                  {...register("username")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDataSourceDialog;
