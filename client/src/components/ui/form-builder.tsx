import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Settings, Trash2, Eye, Save, Code, Smartphone, Monitor, Tablet } from "lucide-react";
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

interface FormBuilderProps {
  eventId?: string;
  initialSchema?: FormField[];
  onSave?: (fields: FormField[]) => void;
  onChange?: (fields: FormField[]) => void;
}

const FIELD_TYPES = [
  { type: "text", label: "Text Input", icon: "📝", description: "Single line text field" },
  { type: "email", label: "Email", icon: "📧", description: "Email address input" },
  { type: "phone", label: "Phone", icon: "📞", description: "Phone number input" },
  { type: "textarea", label: "Text Area", icon: "📄", description: "Multi-line text field" },
  { type: "select", label: "Dropdown", icon: "📋", description: "Dropdown selection" },
  { type: "checkbox", label: "Checkbox", icon: "☑️", description: "Multiple choice options" },
  { type: "radio", label: "Radio Button", icon: "🔘", description: "Single choice options" },
  { type: "file", label: "File Upload", icon: "📎", description: "File attachment field" },
] as const;

const RESPONSIVE_MODES = [
  { mode: "desktop", label: "Desktop", icon: Monitor },
  { mode: "tablet", label: "Tablet", icon: Tablet },
  { mode: "mobile", label: "Mobile", icon: Smartphone },
] as const;

export function FormBuilder({ eventId, initialSchema = [], onSave, onChange }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialSchema);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [previewMode, setPreviewMode] = useState<"builder" | "preview">("builder");
  const [responsiveMode, setResponsiveMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isDragging, setIsDragging] = useState(false);

  // Add a new field to the form
  const addField = (fieldType: typeof FIELD_TYPES[number]["type"]) => {
    const newField: FormField = {
      id: nanoid(),
      type: fieldType,
      label: `${FIELD_TYPES.find(f => f.type === fieldType)?.label} Field`,
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
    
    // Update selected field if it's the one being edited
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
    
    const { destination, source, type } = result;
    
    if (!destination) return;

    if (type === "add-field") {
      // Adding a new field from palette
      const fieldType = FIELD_TYPES[source.index].type;
      addField(fieldType);
    } else if (type === "reorder-fields") {
      // Reordering existing fields
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
        return "max-w-4xl mx-auto";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Form Builder</h2>
            <p className="text-muted-foreground">Create custom registration forms with drag & drop</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Responsive Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              {RESPONSIVE_MODES.map(({ mode, label, icon: Icon }) => (
                <Button
                  key={mode}
                  variant={responsiveMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setResponsiveMode(mode)}
                  className="h-8 w-8 p-0"
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as typeof previewMode)}>
              <TabsList>
                <TabsTrigger value="builder">
                  <Settings className="w-4 h-4 mr-2" />
                  Builder
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Form
            </Button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="flex-1 flex overflow-hidden">
          {previewMode === "builder" ? (
            <>
              {/* Field Palette */}
              <div className="w-80 border-r border-border bg-muted/30 overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-semibold mb-4">Field Types</h3>
                  <Droppable droppableId="field-palette" type="add-field" isDropDisabled>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {FIELD_TYPES.map((fieldType, index) => (
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
                                className={`cursor-grab transition-all ${
                                  snapshot.isDragging ? "shadow-lg rotate-2" : "hover:shadow-md"
                                }`}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl">{fieldType.icon}</span>
                                    <div className="flex-1">
                                      <div className="font-medium">{fieldType.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {fieldType.description}
                                      </div>
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

              {/* Form Canvas */}
              <div className="flex-1 overflow-y-auto">
                <div className={`p-6 ${getContainerClass()}`}>
                  <Card className="min-h-96">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Registration Form
                        <Badge variant="outline">{fields.length} fields</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Droppable droppableId="form-fields" type="reorder-fields">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`space-y-4 min-h-32 p-4 rounded-lg border-2 border-dashed transition-colors ${
                              snapshot.isDraggingOver || isDragging
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25"
                            }`}
                          >
                            {fields.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Drag field types here to build your form</p>
                                <p className="text-sm">Or click on field types to add them</p>
                              </div>
                            ) : (
                              fields.map((field, index) => (
                                <Draggable key={field.id} draggableId={field.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`group relative bg-background border rounded-lg p-4 ${
                                        snapshot.isDragging ? "shadow-lg" : ""
                                      } ${
                                        selectedField?.id === field.id ? "border-primary" : "border-border"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 mr-4">
                                          <FormFieldPreview field={field} />
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            {...provided.dragHandleProps}
                                            className="cursor-grab h-8 w-8 p-0"
                                          >
                                            <Code className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedField(field)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Settings className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeField(field.id)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Field Properties Panel */}
              {selectedField && (
                <div className="w-80 border-l border-border bg-muted/30 overflow-y-auto">
                  <FieldPropertiesPanel
                    field={selectedField}
                    onUpdate={(updates) => updateField(selectedField.id, updates)}
                    onClose={() => setSelectedField(null)}
                  />
                </div>
              )}
            </>
          ) : (
            /* Preview Mode */
            <div className="flex-1 overflow-y-auto bg-muted/30">
              <div className={`p-6 ${getContainerClass()}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>Registration Form Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormPreview fields={fields} />
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

// Field Preview Component
function FormFieldPreview({ field }: { field: FormField }) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </Label>
      
      {field.type === "text" || field.type === "email" || field.type === "phone" ? (
        <Input placeholder={field.placeholder} disabled />
      ) : field.type === "textarea" ? (
        <Textarea placeholder={field.placeholder} disabled />
      ) : field.type === "select" ? (
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || "Select an option..."} />
          </SelectTrigger>
        </Select>
      ) : field.type === "radio" ? (
        <div className="space-y-2">
          {field.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input type="radio" disabled className="w-4 h-4" />
              <Label>{option}</Label>
            </div>
          ))}
        </div>
      ) : field.type === "checkbox" ? (
        <div className="space-y-2">
          {field.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input type="checkbox" disabled className="w-4 h-4" />
              <Label>{option}</Label>
            </div>
          ))}
        </div>
      ) : field.type === "file" ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center text-muted-foreground">
          Click to upload or drag and drop
        </div>
      ) : null}
    </div>
  );
}

// Field Properties Panel
function FieldPropertiesPanel({ 
  field, 
  onUpdate, 
  onClose 
}: { 
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Field Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      <div className="space-y-4">
        {/* Basic Properties */}
        <div>
          <Label htmlFor="field-label">Label</Label>
          <Input
            id="field-label"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="field-placeholder">Placeholder</Label>
          <Input
            id="field-placeholder"
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={field.required}
            onCheckedChange={(required) => onUpdate({ required })}
          />
          <Label>Required field</Label>
        </div>

        {/* Options for select, radio, checkbox */}
        {(field.type === "select" || field.type === "radio" || field.type === "checkbox") && (
          <div>
            <Label>Options</Label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(field.options || [])];
                    newOptions[index] = e.target.value;
                    onUpdate({ options: newOptions });
                  }}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                  onUpdate({ options: newOptions });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        {/* Validation */}
        <Separator />
        <div>
          <Label className="text-sm font-medium">Validation</Label>
          <div className="space-y-3 mt-2">
            {(field.type === "text" || field.type === "textarea") && (
              <>
                <div>
                  <Label htmlFor="min-length" className="text-xs">Min Length</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="max-length" className="text-xs">Max Length</Label>
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
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Form Preview Component
function FormPreview({ fields }: { fields: FormField[] }) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Add fields to see the preview</p>
      </div>
    );
  }

  return (
    <form className="space-y-6">
      {fields.map((field) => (
        <FormFieldPreview key={field.id} field={field} />
      ))}
      <Button type="submit" className="w-full">
        Submit Registration
      </Button>
    </form>
  );
}