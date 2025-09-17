import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { 
  Plus, Settings, Trash2, Eye, Save, Code, Smartphone, Monitor, Tablet, 
  Layout, Layers, Palette, Grid, Type, Image, FileText, CheckSquare, 
  Circle, Upload, Mail, Phone, Calendar, Hash, ToggleLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@shared/schema";
import { nanoid } from "nanoid";

const BIG_FIELD_TYPES = [
  { 
    type: "text", 
    label: "Text Input", 
    icon: Type, 
    description: "Single line text field for names, titles, etc.",
    color: "bg-blue-500/10 text-blue-600 border-blue-200"
  },
  { 
    type: "email", 
    label: "Email Address", 
    icon: Mail, 
    description: "Email validation with proper formatting",
    color: "bg-green-500/10 text-green-600 border-green-200"
  },
  { 
    type: "phone", 
    label: "Phone Number", 
    icon: Phone, 
    description: "Phone input with formatting support",
    color: "bg-purple-500/10 text-purple-600 border-purple-200"
  },
  { 
    type: "textarea", 
    label: "Text Area", 
    icon: FileText, 
    description: "Multi-line text for descriptions and comments",
    color: "bg-orange-500/10 text-orange-600 border-orange-200"
  },
  { 
    type: "select", 
    label: "Dropdown Select", 
    icon: Layers, 
    description: "Single choice from a list of options",
    color: "bg-teal-500/10 text-teal-600 border-teal-200"
  },
  { 
    type: "checkbox", 
    label: "Checkbox Group", 
    icon: CheckSquare, 
    description: "Multiple choice selections",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-200"
  },
  { 
    type: "radio", 
    label: "Radio Buttons", 
    icon: Circle, 
    description: "Single choice from multiple options",
    color: "bg-pink-500/10 text-pink-600 border-pink-200"
  },
  { 
    type: "file", 
    label: "File Upload", 
    icon: Upload, 
    description: "Allow users to upload documents or images",
    color: "bg-red-500/10 text-red-600 border-red-200"
  },
] as const;

const RESPONSIVE_MODES = [
  { mode: "desktop", label: "Desktop", icon: Monitor },
  { mode: "tablet", label: "Tablet", icon: Tablet },
  { mode: "mobile", label: "Mobile", icon: Smartphone },
] as const;

interface PageBuilderProps {
  eventId?: string;
  initialSchema?: FormField[];
  onSave?: (fields: FormField[]) => void;
  onChange?: (fields: FormField[]) => void;
}

export function PageBuilder({ eventId, initialSchema = [], onSave, onChange }: PageBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialSchema);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [previewMode, setPreviewMode] = useState<"builder" | "preview">("builder");
  const [responsiveMode, setResponsiveMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isDragging, setIsDragging] = useState(false);

  // Add a new field to the form
  const addField = (fieldType: typeof BIG_FIELD_TYPES[number]["type"]) => {
    const newField: FormField = {
      id: nanoid(),
      type: fieldType,
      label: `${BIG_FIELD_TYPES.find(f => f.type === fieldType)?.label} Field`,
      placeholder: "",
      required: false,
      options: fieldType === "select" || fieldType === "radio" || fieldType === "checkbox" 
        ? ["Option 1", "Option 2"] 
        : undefined,
      validation: {},
    };
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    setSelectedField(newField);
    onChange?.(updatedFields);
  };

  // Update field properties
  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setFields(updatedFields);
    
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
    
    onChange?.(updatedFields);
  };

  // Remove field
  const removeField = (fieldId: string) => {
    const updatedFields = fields.filter(field => field.id !== fieldId);
    setFields(updatedFields);
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
    onChange?.(updatedFields);
  };

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    
    const { destination, source } = result;
    
    if (!destination) return;

    // Adding a new field from palette to canvas
    if (source.droppableId === "field-palette" && destination.droppableId === "form-fields") {
      const fieldType = BIG_FIELD_TYPES[source.index].type;
      addField(fieldType);
    }
    // Reordering existing fields within canvas
    else if (source.droppableId === "form-fields" && destination.droppableId === "form-fields") {
      const newFields = Array.from(fields);
      const [reorderedField] = newFields.splice(source.index, 1);
      newFields.splice(destination.index, 0, reorderedField);
      setFields(newFields);
      onChange?.(newFields);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Save form schema
  const handleSave = () => {
    onSave?.(fields);
  };

  // Responsive container classes
  const getContainerClass = () => {
    switch (responsiveMode) {
      case "mobile":
        return "max-w-sm mx-auto";
      case "tablet":
        return "max-w-2xl mx-auto";
      default:
        return "max-w-5xl mx-auto";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Page Builder</h1>
                <p className="text-gray-600">Drag & drop components to build your registration form</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Responsive Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {RESPONSIVE_MODES.map(({ mode, label, icon: Icon }) => (
                  <Button
                    key={mode}
                    variant={responsiveMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setResponsiveMode(mode)}
                    className="h-9 px-3"
                    title={label}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as typeof previewMode)}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="builder" className="flex items-center space-x-2">
                    <Grid className="w-4 h-4" />
                    <span>Builder</span>
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Form
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="flex min-h-screen">
          {previewMode === "builder" ? (
            <>
              {/* Component Palette - Left Sidebar */}
              <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Palette className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Components</h3>
                  </div>
                  
                  <Droppable droppableId="field-palette" isDropDisabled>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {BIG_FIELD_TYPES.map((fieldType, index) => (
                          <Draggable
                            key={fieldType.type}
                            draggableId={`palette-${fieldType.type}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => addField(fieldType.type)}
                                className={`cursor-grab transition-all hover:shadow-lg border-2 ${
                                  fieldType.color
                                } ${
                                  snapshot.isDragging ? "shadow-2xl scale-105 rotate-1" : "hover:scale-102"
                                }`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start space-x-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                      fieldType.color.split(' ')[0]
                                    }`}>
                                      <fieldType.icon className={`w-6 h-6 ${fieldType.color.split(' ')[1]}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 mb-1">{fieldType.label}</h4>
                                      <p className="text-sm text-gray-600 leading-relaxed">{fieldType.description}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              {/* Form Canvas - Center */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className={`${getContainerClass()}`}>
                  <Card className="min-h-[600px] shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">Registration Form</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Build your form by dragging components from the left panel</p>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1">
                          {fields.length} {fields.length === 1 ? 'field' : 'fields'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Droppable droppableId="form-fields">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`min-h-64 rounded-xl border-3 border-dashed transition-all duration-200 ${
                              snapshot.isDraggingOver || isDragging
                                ? "border-blue-400 bg-blue-50/50"
                                : "border-gray-300"
                            }`}
                          >
                            {fields.length === 0 ? (
                              <div className="text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                  <Plus className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building</h3>
                                <p className="text-gray-600 mb-1">Drag components from the left panel to build your form</p>
                                <p className="text-sm text-gray-500">Or click on any component to add it instantly</p>
                              </div>
                            ) : (
                              <div className="p-4 space-y-6">
                                {fields.map((field, index) => (
                                  <Draggable key={field.id} draggableId={field.id} index={index}>
                                    {(provided, snapshot) => (
                                      <Card
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`group relative transition-all duration-200 ${
                                          snapshot.isDragging ? "shadow-2xl scale-105" : "shadow-sm hover:shadow-md"
                                        } ${
                                          selectedField?.id === field.id ? "ring-2 ring-blue-500 border-blue-200" : "border-gray-200"
                                        }`}
                                      >
                                        <CardContent className="p-5">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1 mr-4">
                                              <BigFormFieldPreview field={field} />
                                            </div>
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                {...provided.dragHandleProps}
                                                className="cursor-grab h-9 w-9 p-0 hover:bg-gray-100"
                                              >
                                                <Grid className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedField(field)}
                                                className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-600"
                                              >
                                                <Settings className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeField(field.id)}
                                                className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Properties Panel - Right Sidebar */}
              {selectedField && (
                <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto">
                  <BigFieldPropertiesPanel
                    field={selectedField}
                    onUpdate={(updates) => updateField(selectedField.id, updates)}
                    onClose={() => setSelectedField(null)}
                  />
                </div>
              )}
            </>
          ) : (
            /* Preview Mode */
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className={`${getContainerClass()}`}>
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <CardTitle className="text-xl">Registration Form Preview</CardTitle>
                    <p className="text-blue-100">This is how your form will appear to users</p>
                  </CardHeader>
                  <CardContent className="p-8">
                    <BigFormPreview fields={fields} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DragDropContext>
    </div>
  );
}

// Enhanced Field Preview Component
function BigFormFieldPreview({ field }: { field: FormField }) {
  return (
    <div className="space-y-3">
      <Label className="flex items-center space-x-2 text-base font-medium">
        <span>{field.label}</span>
        {field.required && <span className="text-red-500 font-bold">*</span>}
      </Label>
      
      {field.type === "text" || field.type === "email" || field.type === "phone" ? (
        <Input 
          placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`} 
          disabled 
          className="h-11"
        />
      ) : field.type === "textarea" ? (
        <Textarea 
          placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`} 
          disabled 
          rows={4}
          className="min-h-[100px]"
        />
      ) : field.type === "select" ? (
        <Select disabled>
          <SelectTrigger className="h-11">
            <SelectValue placeholder={field.placeholder || "Choose an option..."} />
          </SelectTrigger>
        </Select>
      ) : field.type === "radio" ? (
        <div className="space-y-3">
          {field.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input type="radio" disabled className="w-4 h-4 text-blue-600" />
              <Label className="text-base">{option}</Label>
            </div>
          ))}
        </div>
      ) : field.type === "checkbox" ? (
        <div className="space-y-3">
          {field.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input type="checkbox" disabled className="w-4 h-4 text-blue-600 rounded" />
              <Label className="text-base">{option}</Label>
            </div>
          ))}
        </div>
      ) : field.type === "file" ? (
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
          <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-blue-700 font-medium">Click to upload or drag and drop files</p>
          <p className="text-blue-500 text-sm mt-1">Supported formats: PDF, JPG, PNG</p>
        </div>
      ) : null}
    </div>
  );
}

// Enhanced Properties Panel
function BigFieldPropertiesPanel({ 
  field, 
  onUpdate, 
  onClose 
}: { 
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Field Settings</h3>
          <p className="text-sm text-gray-600">Customize your field properties</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Properties */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <Type className="w-4 h-4" />
            <span>Basic Settings</span>
          </h4>
          
          <div>
            <Label htmlFor="field-label" className="text-sm font-medium mb-2 block">Field Label</Label>
            <Input
              id="field-label"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="h-10"
            />
          </div>

          <div>
            <Label htmlFor="field-placeholder" className="text-sm font-medium mb-2 block">Placeholder Text</Label>
            <Input
              id="field-placeholder"
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Enter placeholder text..."
              className="h-10"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="font-medium">Required Field</Label>
              <p className="text-sm text-gray-600">Make this field mandatory</p>
            </div>
            <Switch
              checked={field.required}
              onCheckedChange={(required) => onUpdate({ required })}
            />
          </div>
        </div>

        {/* Options for select, radio, checkbox */}
        {(field.type === "select" || field.type === "radio" || field.type === "checkbox") && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Options</span>
              </h4>
              <div className="space-y-3">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])];
                        newOptions[index] = e.target.value;
                        onUpdate({ options: newOptions });
                      }}
                      className="h-9"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = field.options?.filter((_, i) => i !== index);
                        onUpdate({ options: newOptions });
                      }}
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                    onUpdate({ options: newOptions });
                  }}
                  className="w-full h-10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Validation */}
        <Separator />
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <CheckSquare className="w-4 h-4" />
            <span>Validation Rules</span>
          </h4>
          
          {(field.type === "text" || field.type === "textarea") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="min-length" className="text-xs font-medium">Min Length</Label>
                <Input
                  id="min-length"
                  type="number"
                  value={field.validation?.minLength || ""}
                  onChange={(e) => onUpdate({ 
                    validation: { 
                      ...field.validation, 
                      minLength: e.target.value ? parseInt(e.target.value) : undefined 
                    }
                  })}
                  className="h-9 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="max-length" className="text-xs font-medium">Max Length</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={field.validation?.maxLength || ""}
                  onChange={(e) => onUpdate({ 
                    validation: { 
                      ...field.validation, 
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                    }
                  })}
                  className="h-9 mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Form Preview Component
function BigFormPreview({ fields }: { fields: FormField[] }) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fields Added</h3>
        <p className="text-gray-600">Add some fields to see the preview</p>
      </div>
    );
  }

  return (
    <form className="space-y-8">
      {fields.map((field) => (
        <BigFormFieldPreview key={field.id} field={field} />
      ))}
      <div className="pt-6">
        <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold">
          Submit Registration
        </Button>
      </div>
    </form>
  );
}