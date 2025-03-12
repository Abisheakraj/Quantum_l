import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Database, Filter, ArrowRight, ArrowDown, Plus, Save, Code, Settings, HardDrive, Cog, ArrowRightLeft, Trash2, Link } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { FlowNode, FlowEdge } from "@/types/flow";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  NodeTypes,
  addEdge,
  Connection,
  Panel,
  Node,
  Edge,
  Position,
  BackgroundVariant,
  MarkerType,
  EdgeTypes,
  EdgeLabelRenderer,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface FlowDesignerTabProps {
  projectId: string;
}

interface SchemaTable {
  name: string;
  columns: ColumnType[];
}

interface RelationshipData {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  id: string;
}

interface ColumnType {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: string;
}

const TableNode = ({ data, id }: { data: any, id: string }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 w-[280px]">
      <div className="font-semibold text-base mb-2 flex justify-between items-center">
        <span>{data.label}</span>
        {data.onDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 rounded-full hover:bg-red-100"
            onClick={() => data.onDelete(id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
      </div>
      {data.source && <div className="text-xs text-muted-foreground mb-2">{data.source}</div>}
      {data.columns && (
        <div className="max-h-40 overflow-auto divide-y divide-gray-100">
          {data.columns.map((col: { name: string; type: string; isPrimaryKey?: boolean; isForeignKey?: boolean; references?: string }) => (
            <div key={col.name} className="text-xs py-1.5 flex justify-between items-center">
              <div className="flex items-center">
                {col.isPrimaryKey && <div className="w-2 h-2 bg-amber-500 rounded-full mr-1.5" title="Primary Key" />}
                {col.isForeignKey && <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5" title="Foreign Key" />}
                <span className={col.isPrimaryKey ? "font-semibold" : ""}>{col.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground">{col.type}</span>
                {col.isForeignKey && col.references && (
                  <span className="ml-1.5 text-blue-500" title={`References ${col.references}`}>
                    <Link className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {data.onAddColumn && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-xs h-6 border border-dashed border-gray-300"
          onClick={() => data.onAddColumn(id)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Column
        </Button>
      )}
    </div>
  );
};

const TransformationNode = ({ data }: { data: any }) => {
  return (
    <div className="bg-blue-50 rounded-lg shadow-md p-4 border border-blue-100 w-[240px]">
      <div className="font-semibold text-base mb-2 flex justify-between items-center">
        <span>{data.label}</span>
        {data.onDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 rounded-full hover:bg-red-100"
            onClick={() => data.onDelete(data.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{data.type} transformation</div>
      <div className="mt-2">
        <Button variant="outline" size="sm" className="w-full">
          <Settings className="h-3 w-3 mr-1" />
          Configure
        </Button>
      </div>
    </div>
  );
};

// Custom edge with hover tooltip
const RelationshipEdge = ({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style = {}, markerEnd }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + 50} ${sourceY} ${targetX - 50} ${targetY} ${targetX} ${targetY}`;

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: '#3b82f6',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              background: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              pointerEvents: 'all',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
      {isHovered && data?.relationship && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2 - 40}px)`,
              background: '#ffffff',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              pointerEvents: 'none',
              minWidth: '200px',
            }}
          >
            <div className="font-medium text-sm mb-1">Relationship Details</div>
            <div className="text-xs text-muted-foreground mb-1">Type: {data.relationship.type || 'One-to-Many'}</div>
            <div className="text-xs">
              <span className="font-medium">{data.sourceTable}</span>
              .{data.sourceColumn} → <span className="font-medium">{data.targetTable}</span>.{data.targetColumn}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = {
  table: TableNode,
  transformation: TransformationNode,
};

const edgeTypes = {
  relationship: RelationshipEdge
};

type NodeSelectorType = {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const nodeSelectors: NodeSelectorType[] = [
  {
    type: "table",
    label: "Source Table",
    description: "Add a data source table",
    icon: <Database className="h-5 w-5" />,
  },
  {
    type: "filter",
    label: "Filter",
    description: "Filter data based on conditions",
    icon: <Filter className="h-5 w-5" />,
  },
  {
    type: "join",
    label: "Join",
    description: "Join multiple data sources",
    icon: <ArrowRightLeft className="h-5 w-5" />,
  },
  {
    type: "output",
    label: "Output",
    description: "Data output destination",
    icon: <HardDrive className="h-5 w-5" />,
  },
];

const NodeSelector = ({ isOpen, onClose, onAddNode }: { isOpen: boolean; onClose: () => void; onAddNode: (type: string) => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Node</DialogTitle>
          <DialogDescription>Select a node type to add to your flow</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {nodeSelectors.map((nodeType) => (
            <Button
              key={nodeType.type}
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-4 hover:bg-muted"
              onClick={() => onAddNode(nodeType.type)}
            >
              <div className="text-primary mb-2">{nodeType.icon}</div>
              <div className="font-medium">{nodeType.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{nodeType.description}</div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ColumnDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  tableId, 
  existingColumns = [] 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (tableId: string, columns: ColumnType[]) => void; 
  tableId: string;
  existingColumns?: ColumnType[];
}) => {
  const [columns, setColumns] = useState(existingColumns);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("varchar");
  const [isPrimaryKey, setIsPrimaryKey] = useState(false);
  const [isForeignKey, setIsForeignKey] = useState(false);
  const [references, setReferences] = useState("");

  useEffect(() => {
    setColumns(existingColumns);
  }, [existingColumns, isOpen]);

  const handleAddColumn = () => {
    if (!newColumnName) return;
    
    const newColumn = {
      name: newColumnName,
      type: newColumnType,
      isPrimaryKey,
      isForeignKey,
      references: isForeignKey ? references : undefined
    };
    
    setColumns([...columns, newColumn]);
    setNewColumnName("");
    setNewColumnType("varchar");
    setIsPrimaryKey(false);
    setIsForeignKey(false);
    setReferences("");
  };

  const handleRemoveColumn = (index: number) => {
    const updatedColumns = [...columns];
    updatedColumns.splice(index, 1);
    setColumns(updatedColumns);
  };

  const handleSave = () => {
    onSave(tableId, columns);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Table Columns</DialogTitle>
          <DialogDescription>Add, edit or remove columns for this table</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
              <div className="col-span-4">Column Name</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-2">Primary Key</div>
              <div className="col-span-2">Foreign Key</div>
              <div className="col-span-1"></div>
            </div>
            
            <ScrollArea className="h-[200px]">
              {columns.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No columns defined yet. Add columns below.
                </div>
              ) : (
                <div className="divide-y">
                  {columns.map((column, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-3 items-center">
                      <div className="col-span-4">{column.name}</div>
                      <div className="col-span-3">{column.type}</div>
                      <div className="col-span-2">
                        {column.isPrimaryKey ? (
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-amber-500 rounded-full mr-1.5" />
                            <span>Yes</span>
                          </div>
                        ) : "No"}
                      </div>
                      <div className="col-span-2">
                        {column.isForeignKey ? (
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1.5" />
                            <span>Yes</span>
                          </div>
                        ) : "No"}
                      </div>
                      <div className="col-span-1 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 rounded-full hover:bg-red-100"
                          onClick={() => handleRemoveColumn(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <div className="border rounded-md p-3">
            <h4 className="font-medium mb-3">Add New Column</h4>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-4">
                <Label htmlFor="column-name" className="mb-1 block text-xs">Column Name</Label>
                <Input 
                  id="column-name" 
                  value={newColumnName} 
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="e.g., customer_id"
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="column-type" className="mb-1 block text-xs">Data Type</Label>
                <select 
                  id="column-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value)}
                >
                  <option value="varchar">varchar</option>
                  <option value="int">int</option>
                  <option value="bigint">bigint</option>
                  <option value="boolean">boolean</option>
                  <option value="timestamp">timestamp</option>
                  <option value="date">date</option>
                  <option value="decimal">decimal</option>
                  <option value="text">text</option>
                  <option value="json">json</option>
                </select>
              </div>
              <div className="col-span-2">
                <div className="h-7"></div> {/* Spacer to align with inputs */}
                <div className="flex items-center h-10">
                  <input 
                    type="checkbox" 
                    id="is-primary" 
                    checked={isPrimaryKey}
                    onChange={() => setIsPrimaryKey(!isPrimaryKey)}
                    className="mr-2"
                  />
                  <Label htmlFor="is-primary" className="text-sm cursor-pointer">Primary Key</Label>
                </div>
              </div>
              <div className="col-span-2">
                <div className="h-7"></div> {/* Spacer to align with inputs */}
                <div className="flex items-center h-10">
                  <input 
                    type="checkbox" 
                    id="is-foreign" 
                    checked={isForeignKey}
                    onChange={() => setIsForeignKey(!isForeignKey)}
                    className="mr-2"
                  />
                  <Label htmlFor="is-foreign" className="text-sm cursor-pointer">Foreign Key</Label>
                </div>
              </div>
              <div className="col-span-1">
                <div className="h-7"></div> {/* Spacer to align with inputs */}
                <Button 
                  onClick={handleAddColumn} 
                  disabled={!newColumnName} 
                  className="h-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isForeignKey && (
              <div className="mt-3">
                <Label htmlFor="references" className="mb-1 block text-xs">References Table.Column</Label>
                <Input 
                  id="references" 
                  value={references} 
                  onChange={(e) => setReferences(e.target.value)}
                  placeholder="e.g., users.id"
                  className="max-w-[300px]"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Columns
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RelationshipDialog = ({ 
  isOpen, 
  onClose, 
  nodes,
  onAddRelationship
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  nodes: Node[];
  onAddRelationship: (relationship: RelationshipData) => void;
}) => {
  const [sourceTable, setSourceTable] = useState("");
  const [sourceColumn, setSourceColumn] = useState("");
  const [targetTable, setTargetTable] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  
  const sourceTableNode = nodes.find(node => node.id === sourceTable);
  const targetTableNode = nodes.find(node => node.id === targetTable);
  
  // Explicitly type and provide default empty arrays
  const sourceColumns: ColumnType[] = sourceTableNode?.data?.columns ? 
    Array.isArray(sourceTableNode.data.columns) ? sourceTableNode.data.columns : [] 
    : [];
  
  const targetColumns: ColumnType[] = targetTableNode?.data?.columns ? 
    Array.isArray(targetTableNode.data.columns) ? targetTableNode.data.columns : []
    : [];
  
  const handleSubmit = () => {
    if (!sourceTable || !sourceColumn || !targetTable || !targetColumn) {
      toast({
        title: "Missing information",
        description: "Please select all required fields for the relationship",
        variant: "destructive"
      });
      return;
    }
    
    onAddRelationship({
      sourceTable,
      sourceColumn,
      targetTable,
      targetColumn,
      id: `rel-${Date.now()}`
    });
    
    // Reset form
    setSourceTable("");
    setSourceColumn("");
    setTargetTable("");
    setTargetColumn("");
    onClose();
  };
  
  const tableNodes = nodes.filter(node => node.type === 'table');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Table Relationship</DialogTitle>
          <DialogDescription>Define a relationship between two tables</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="source-table">Source Table</Label>
            <select 
              id="source-table"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={sourceTable}
              onChange={(e) => {
                setSourceTable(e.target.value);
                setSourceColumn("");
              }}
            >
              <option value="">Select a table</option>
              {tableNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data?.label ? String(node.data.label) : "Unnamed Table"}
                </option>
              ))}
            </select>
          </div>
          
          {sourceTable && (
            <div className="space-y-2">
              <Label htmlFor="source-column">Source Column</Label>
              <select 
                id="source-column"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={sourceColumn}
                onChange={(e) => setSourceColumn(e.target.value)}
              >
                <option value="">Select a column</option>
                {sourceColumns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.type})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex justify-center">
            <div className="bg-muted rounded-full p-2">
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target-table">Target Table</Label>
            <select 
              id="target-table"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={targetTable}
              onChange={(e) => {
                setTargetTable(e.target.value);
                setTargetColumn("");
              }}
            >
              <option value="">Select a table</option>
              {tableNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data?.label ? String(node.data.label) : "Unnamed Table"}
                </option>
              ))}
            </select>
          </div>
          
          {targetTable && (
            <div className="space-y-2">
              <Label htmlFor="target-column">Target Column</Label>
              <select 
                id="target-column"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
              >
                <option value="">Select a column</option>
                {targetColumns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Relationship
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PreviewDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<Array<Record<string, any>>>([]);
  
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate API call to fetch preview data
      setTimeout(() => {
        setPreviewData([
          { id: 1, customer_name: "John Doe", order_total: 123.45, status: "completed" },
          { id: 2, customer_name: "Jane Smith", order_total: 67.89, status: "processing" },
          { id: 3, customer_name: "Bob Johnson", order_total: 246.80, status: "pending" },
          { id: 4, customer_name: "Sarah Williams", order_total: 890.50, status: "completed" },
          { id: 5, customer_name: "Michael Brown", order_total: 45.99, status: "processing" },
        ]);
        setIsLoading(false);
      }, 1500);
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Flow Preview</DialogTitle>
          <DialogDescription>Preview of the data result from the current flow</DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Generating preview...</p>
            </div>
          </div>
        ) : (
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  {Object.keys(previewData[0]).map((key) => (
                    <th key={key} className="px-4 py-2 text-left font-medium text-sm">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="border-t">
                    {Object.values(row).map((value: any, j) => (
                      <td key={j} className="px-4 py-2 text-sm">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FlowDesignerTab = ({ projectId }: FlowDesignerTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null);
  const [isTransformSheetOpen, setIsTransformSheetOpen] = useState(false);
  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const mockSources = [
    {
      id: "src1",
      name: "Sales MySQL Database",
      tables: [
        {
          name: "customers",
          columns: [
            { name: "id", type: "int", isPrimaryKey: true },
            { name: "name", type: "varchar" },
            { name: "email", type: "varchar" },
            { name: "created_at", type: "timestamp" },
          ],
        },
        {
          name: "orders",
          columns: [
            { name: "id", type: "int", isPrimaryKey: true },
            { name: "customer_id", type: "int", isForeignKey: true, references: "customers.id" },
            { name: "total", type: "decimal" },
            { name: "status", type: "varchar" },
            { name: "created_at", type: "timestamp" },
          ],
        },
        {
          name: "products",
          columns: [
            { name: "id", type: "int", isPrimaryKey: true },
            { name: "name", type: "varchar" },
            { name: "price", type: "decimal" },
            { name: "category", type: "varchar" },
          ],
        },
      ],
    },
    {
      id: "src2",
      name: "Customer PostgreSQL Database",
      tables: [
        {
          name: "users",
          columns: [
            { name: "id", type: "serial", isPrimaryKey: true },
            { name: "username", type: "varchar" },
            { name: "email", type: "varchar" },
            { name: "active", type: "boolean" },
          ],
        },
        {
          name: "profiles",
          columns: [
            { name: "id", type: "serial", isPrimaryKey: true },
            { name: "user_id", type: "int", isForeignKey: true, references: "users.id" },
            { name: "full_name", type: "varchar" },
            { name: "address", type: "varchar" },
            { name: "phone", type: "varchar" },
          ],
        },
      ],
    },
  ];

  const filteredDatabases = searchQuery 
    ? mockSources.filter(db => db.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : mockSources;

  const filteredTables = selectedDatabase && searchQuery
    ? mockSources
        .find(db => db.id === selectedDatabase)
        ?.tables.filter(table => table.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : selectedDatabase
    ? mockSources.find(db => db.id === selectedDatabase)?.tables
    : [];

  const onConnect = useCallback((params: Connection) => {
    const sourceNode = nodes.find(node => node.id === params.source);
    const targetNode = nodes.find(node => node.id === params.target);
    
    if (sourceNode && targetNode) {
      // Improved edge styling with relationship data
      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'relationship',
        animated: true,
        style: { 
          stroke: '#3b82f6', 
          strokeWidth: 2 
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#3b82f6',
        },
        data: {
          label: `${sourceNode.data.label} → ${targetNode.data.label}`,
          sourceTable: sourceNode.data.label,
          targetTable: targetNode.data.label,
          relationship: {
            type: 'One-to-Many'
          }
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Update column data to reflect relationship
      if (sourceNode.type === 'table' && targetNode.type === 'table') {
        toast({
          title: "Relationship created",
          description: `Relationship between ${sourceNode.data.label} and ${targetNode.data.label} has been created`
        });
      }
    }
  }, [nodes, setEdges]);

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const handleAddColumn = (tableId: string) => {
    setSelectedTableId(tableId);
    
    // Find existing columns for the table
    const tableNode = nodes.find(node => node.id === tableId);
    const columns = tableNode?.data?.columns || [];
    
    setIsColumnDialogOpen(true);
  };

  const handleSaveColumns = (tableId: string, columns: any[]) => {
    setNodes(nodes.map(node => {
      if (node.id === tableId) {
        return {
          ...node,
          data: {
            ...node.data,
            columns
          }
        };
      }
      return node;
    }));
    
    toast({
      title: "Columns updated",
      description: `Table columns have been successfully updated.`
    });
  };

  const addNodeToFlow = (table: SchemaTable) => {
    const xPos = nodes.length * 300 + 50;
    const newNode: Node = {
      id: `table-${Date.now()}`,
      type: 'table',
      position: { x: xPos, y: 100 },
      data: {
        label: table.name,
        source: selectedDatabase ? mockSources.find(db => db.id === selectedDatabase)?.name : "",
        columns: table.columns,
        onDelete: handleDeleteNode,
        onAddColumn: handleAddColumn,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    
    setNodes((nds) => [...nds, newNode]);
    setSelectedTable(null);
    
    toast({
      title: "Table added",
      description: `${table.name} has been added to the flow.`
    });
  };

  const addTransformationNode = (type: string, sourceNodeId: string) => {
    const sourceNode = nodes.find(node => node.id === sourceNodeId);
    if (!sourceNode) return;
    
    const newNode: Node = {
      id: `transformation-${Date.now()}`,
      type: 'transformation',
      position: { x: sourceNode.position.x + 300, y: sourceNode.position.y },
      data: {
        label: `${type} Transformation`,
        type,
        sourceNodeId,
        id: `transformation-${Date.now()}`,
        onDelete: handleDeleteNode,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    
    const newEdge: Edge = {
      id: `edge-${sourceNodeId}-${newNode.id}`,
      source: sourceNodeId,
      target: newNode.id,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    setIsTransformSheetOpen(false);
    
    toast({
      title: "Transformation added",
      description: `${type} transformation node has been added to the flow.`
    });
  };

  const onAddGenericNode = (nodeType: string) => {
    const nodeCount = nodes.filter(n => n.type === nodeType).length;
    let label = "";
    let type = "";
    
    switch (nodeType) {
      case "filter":
        label = "Filter Transformation";
        type = "filter";
        break;
      case "join":
        label = "Join Transformation";
        type = "join";
        break;
      case "output":
        label = "Output Destination";
        type = "output";
        break;
      default:
        label = "New Node";
        type = nodeType;
    }
    
    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType === "output" ? "table" : "transformation",
      position: { 
        x: Math.random() * 300 + 200, 
        y: Math.random() * 200 + 100 
      },
      data: {
        label: `${label} ${nodeCount + 1}`,
        type: type,
        id: `${nodeType}-${Date.now()}`,
        onDelete: handleDeleteNode,
        onAddColumn: nodeType === "output" ? handleAddColumn : undefined,
        columns: nodeType === "output" ? [] : undefined,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    
    setNodes((nds) => [...nds, newNode]);
    setIsNodeSelectorOpen(false);
    
    toast({
      title: "Node added",
      description: `${label} ${nodeCount + 1} has been added to the flow.`
    });
  };
  
  const handleAddRelationship = (relationship: RelationshipData) => {
    const { sourceTable, sourceColumn, targetTable, targetColumn, id } = relationship;
    
    const sourceNode = nodes.find(node => node.id === sourceTable);
    const targetNode = nodes.find(node => node.id === targetTable);
    
    if (!sourceNode || !targetNode) return;
    
    // Enhanced edge with relationship data for hover details
    const newEdge: Edge = {
      id: `edge-${id}`,
      source: sourceTable,
      target: targetTable,
      animated: true,
      type: 'relationship',
      style: { 
        stroke: '#3b82f6', 
        strokeWidth: 3, // Make lines thicker
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#3b82f6',
      },
      data: {
        label: `${sourceColumn} → ${targetColumn}`,
        sourceTable: sourceNode.data?.label,
        targetTable: targetNode.data?.label,
        sourceColumn: sourceColumn,
        targetColumn: targetColumn,
        relationship: {
          type: 'One-to-Many',
          description: `Foreign key relationship from ${sourceNode.data?.label}.${sourceColumn} to ${targetNode.data?.label}.${targetColumn}`
        }
      }
    };
    
    setEdges((eds) => [...eds, newEdge]);
    
    setNodes(nodes.map(node => {
      if (node.id === targetTable) {
        const columns = node.data?.columns?.map((col: ColumnType) => {
          if (col.name === targetColumn) {
            return {
              ...col,
              isForeignKey: true,
              references: `${sourceNode.data?.label}.${sourceColumn}`
            };
          }
          return col;
        }) || [];
        
        return {
          ...node,
          data: {
            ...node.data,
            columns
          }
        };
      }
      return node;
    }));
    
    toast({
      title: "Relationship created",
      description: `Relationship from ${sourceNode.data?.label}.${sourceColumn} to ${targetNode.data?.label}.${targetColumn} has been created.`
    });
  };

  const onSaveFlow = () => {
    toast({
      title: "Flow saved",
      description: "Your flow has been saved successfully."
    });
  };

  const onPreviewFlow = () => {
    setIsPreviewDialogOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <div className="rounded-lg border h-[600px] flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Data Sources</h3>
            </div>
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {!selectedDatabase ? (
                <div className="space-y-4">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Select Database
                  </Label>
                  {filteredDatabases.map((database) => (
                    <div
                      key={database.id}
                      className="group p-3 rounded-md hover:bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedDatabase(database.id)}
                    >
                      <div className="font-medium group-hover:text-primary">{database.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {database.tables.length} tables available
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tables
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDatabase(null);
                        setSelectedTable(null);
                      }}
                    >
                      Back
                    </Button>
                  </div>
                  
                  {filteredTables?.map((table) => (
                    <div
                      key={table.name}
                      className={`group p-3 rounded-md hover:bg-gray-100 cursor-pointer ${
                        selectedTable?.name === table.name ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => setSelectedTable(table)}
                    >
                      <div className="font-medium group-hover:text-primary">{table.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {table.columns.length} columns
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          
          {selectedTable && (
            <div className="p-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{selectedTable.name}</h4>
                <Button size="sm" onClick={() => addNodeToFlow(selectedTable)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Flow
                </Button>
              </div>
              <ScrollArea className="h-40">
                <div className="space-y-1">
                  {selectedTable.columns.map((column) => (
                    <div key={column.name} className="text-sm grid grid-cols-2 py-1 border-b border-gray-100">
                      <div className="flex items-center">
                        {column.isPrimaryKey && <div className="w-2 h-2 bg-amber-500 rounded-full mr-1.5" title="Primary Key" />}
                        {column.isForeignKey && <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5" title="Foreign Key" />}
                        {column.name}
                      </div>
                      <div className="text-muted-foreground text-xs text-right">{column.type}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
      
      <div className="md:col-span-3">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Flow Designer</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNodeSelectorOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Node
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsRelationshipDialogOpen(true)}>
              <Link className="h-4 w-4 mr-1" />
              Add Relationship
            </Button>
            <Button variant="outline" size="sm" onClick={onSaveFlow}>
              <Save className="h-4 w-4 mr-1" />
              Save Flow
            </Button>
            <Button size="sm" onClick={onPreviewFlow}>
              Preview
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg h-[600px] overflow-hidden" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
            defaultEdgeOptions={{
              animated: true,
              type: 'relationship',
              style: { 
                strokeWidth: 2,
                stroke: '#3b82f6',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#3b82f6',
              },
            }}
            attributionPosition="bottom-right"
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <NodeSelector 
          isOpen={isNodeSelectorOpen}
          onClose={() => setIsNodeSelectorOpen(false)}
          onAddNode={onAddGenericNode}
        />
        
        <ColumnDialog
          isOpen={isColumnDialogOpen}
          onClose={() => setIsColumnDialogOpen(false)}
          onSave={handleSaveColumns}
          tableId={selectedTableId || ""}
          existingColumns={nodes.find(node => node.id === selectedTableId)?.data?.columns || []}
        />
        
        <RelationshipDialog
          isOpen={isRelationshipDialogOpen}
          onClose={() => setIsRelationshipDialogOpen(false)}
          nodes={nodes}
          onAddRelationship={handleAddRelationship}
        />
        
        <PreviewDialog
          isOpen={isPreviewDialogOpen}
          onClose={() => setIsPreviewDialogOpen(false)}
        />

        <div className="mt-4 text-sm text-muted-foreground">
          <p>The backend developer working on Apache NiFi can use the flow definition generated here to create the actual NiFi processors and connections.</p>
        </div>
      </div>
    </div>
  );
};

export default FlowDesignerTab;
