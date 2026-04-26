"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  TouchSensor,
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2, GripVertical, GripHorizontal, Info, Zap } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";

export type Id = string | number;

export type Column = {
  id: Id;
  title: string;
};

export type TaskColor = 'zinc' | 'yellow' | 'blue' | 'emerald' | 'rose';

export type Task = {
  id: Id;
  columnId: Id;
  content: string;
  color?: TaskColor;
};

const generateId = () => Math.floor(Math.random() * 10001);

const defaultCols: Column[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

const defaultTasks: Task[] = [];

export default function KanbanPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);

  // For Drag Overlay rendering
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Initialization from localStorage
  useEffect(() => {
    setIsClient(true);
    const savedCols = localStorage.getItem("kanban_columns");
    const savedTasks = localStorage.getItem("kanban_tasks");

    if (savedCols && savedTasks) {
      setColumns(JSON.parse(savedCols));
      setTasks(JSON.parse(savedTasks));
    } else {
      setColumns(defaultCols);
      setTasks(defaultTasks);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem("kanban_columns", JSON.stringify(columns));
    localStorage.setItem("kanban_tasks", JSON.stringify(tasks));
  }, [columns, tasks, isClient]);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!isClient) return <div className="min-h-screen py-20 px-8 flex justify-center items-center"><div className="w-8 h-8 rounded-full border-t-2 border-white animate-spin"></div></div>;

  const createColumn = () => {
    const newCol: Column = { id: generateId(), title: `Column ${columns.length + 1}` };
    setColumns([...columns, newCol]);
  };

  const deleteColumn = (id: Id) => {
    setColumns(columns.filter((c) => c.id !== id));
    setTasks(tasks.filter((t) => t.columnId !== id)); // Delete tasks inside it
  };

  const updateColumn = (id: Id, title: string) => {
    setColumns(columns.map((c) => c.id === id ? { ...c, title } : c));
  };

  const createTask = (columnId: Id) => {
    const newTask: Task = { id: generateId(), columnId, content: "", color: 'zinc' };
    setTasks([...tasks, newTask]);
  };

  const deleteTask = (id: Id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const updateTask = (id: Id, content: string) => {
    setTasks(tasks.map((t) => t.id === id ? { ...t, content } : t));
  };

  const updateTaskColor = (id: Id, color: TaskColor) => {
    setTasks(tasks.map((t) => t.id === id ? { ...t, color } : t));
  };

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const overIndex = tasks.findIndex(t => t.id === overId);
        if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
          tasks[activeIndex].columnId = tasks[overIndex].columnId;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }
        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Dropping a Task over an empty Column area
    if (isActiveTask && isOverColumn) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        tasks[activeIndex].columnId = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === "Column") {
      if (active.id !== over.id) {
        setColumns((cols) => {
          const activeIndex = cols.findIndex((col) => col.id === active.id);
          const overIndex = cols.findIndex((col) => col.id === over.id);
          return arrayMove(cols, activeIndex, overIndex);
        });
      }
    }
  };

  return (
    <div className="min-h-[80vh] py-10 px-4 md:px-8 max-w-[1600px] mx-auto flex flex-col items-start w-full relative z-0">
      {/* Header */}
      <div className="w-full mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center px-2">
        <div>
              <button 
                  onClick={() => setShowHelp(true)}
                  className="absolute -top-2 -left-2 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-all shadow-xl z-30"
                  title="Help & FAQ"
              >
                  <Info size={10} className="pointer-events-none" />
              </button>
              <Zap size={11} className="text-white ml-6" />
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-300">Productivity</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-2">Kanban Board</h1>
          <p className="text-zinc-500 font-medium tracking-wide text-sm">Organize tasks, track progress. 100% local and private.</p>
        </div>
        <button 
          onClick={createColumn}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm tracking-wide hover:bg-zinc-200 transition-colors flex items-center gap-2 group whitespace-nowrap"
        >
          <Plus size={16} className="group-hover:scale-125 transition-transform" /> Add List
        </button>
      </div>

      {/* Board Canvas */}
      <div className="w-full relative z-10 pb-20">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex overflow-x-auto pb-10 gap-6 w-full items-start px-2 py-2 snap-x subtle-scrollbar lg:grid lg:grid-cols-3">
            <SortableContext items={columnsId} strategy={rectSortingStrategy}>
              {columns.map((col) => (
                <div key={col.id} className="min-w-[85vw] md:min-w-[45vw] lg:min-w-0 snap-center">
                  <ColumnContainer 
                    column={col} 
                    deleteColumn={deleteColumn}
                    updateColumn={updateColumn}
                    createTask={createTask}
                    deleteTask={deleteTask}
                    updateTask={updateTask}
                    updateTaskColor={updateTaskColor}
                    tasks={tasks.filter((t) => t.columnId === col.id)}
                  />
                </div>
              ))}
            </SortableContext>
          </div>

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
            {activeColumn && (
              <div className="w-[85vw] md:w-[45vw] lg:w-[30vw] xl:w-[25vw] max-w-[400px]">
                <ColumnContainer 
                  column={activeColumn} 
                  deleteColumn={deleteColumn} 
                  updateColumn={updateColumn}
                  createTask={createTask}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  updateTaskColor={updateTaskColor}
                  tasks={tasks.filter((t) => t.columnId === activeColumn.id)}
                  isOverlay
                />
              </div>
            )}
            {activeTask && (
              <TaskCard 
                task={activeTask} 
                deleteTask={deleteTask} 
                updateTask={updateTask} 
                updateTaskColor={updateTaskColor}
                isOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        title="Kanban Board Intelligence"
      >
        <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16">
            <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 space-y-6 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl">
                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-2">Organize Your Brain Without the Clutter</h3>
                <p className="text-base leading-relaxed text-zinc-400 max-w-3xl font-medium">
                    The AssetNest Kanban Board strips away complicated corporate assigning layers and annoying burndown charts. It gives you a pure, frictionless workspace to quickly throw your messy thoughts onto sticky notes.
                </p>
            </section>
            
            <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 border border-zinc-900 rounded-[3rem] md:p-10">
                <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Kanban FAQ</h3>
                <Accordion>
                    <AccordionItem title="How do I change colored sticky notes?">
                        Hover over any active task card. An inline toolbar will appear on the right side offering 5 distinct color accents (Zinc, Yellow, Blue, Green, Red).
                    </AccordionItem>
                    <AccordionItem title="Where is my data saved?">
                        This tool operates with a strict 100% local-first policy. Your workflow data is securely serialized into your browser's local storage and never transmitted to our servers.
                    </AccordionItem>
                    <AccordionItem title="How do I edit column names?">
                        Simply click the white column header text ("To Do", "In Progress", etc.) and begin typing. You can delete columns entirely by clicking the garbage bin inside the header.
                    </AccordionItem>
                </Accordion>
            </section>
        </div>
      </HelpModal>

      {/* CSS adjustments scoped component */}
      <style dangerouslySetInnerHTML={{__html:`
        .subtle-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .subtle-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .subtle-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 9999px; }
        .subtle-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}} />
    </div>
  );
}

// ---------------- COLUMN COMPONENT ----------------

interface ColumnProps {
  column: Column;
  tasks: Task[];
  deleteColumn: (id: Id) => void;
  updateColumn: (id: Id, title: string) => void;
  createTask: (id: Id) => void;
  deleteTask: (id: Id) => void;
  updateTask: (id: Id, content: string) => void;
  updateTaskColor: (id: Id, color: TaskColor) => void;
  isOverlay?: boolean;
}

function ColumnContainer({ column, tasks, deleteColumn, updateColumn, createTask, deleteTask, updateTask, updateTaskColor, isOverlay }: ColumnProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column }
  });

  const style = { 
    transition, 
    transform: CSS.Transform.toString(transform),
  };

  const tasksIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-40 border-2 border-emerald-500/50 bg-zinc-950 w-full shrink-0 h-[80vh] rounded-3xl flex flex-col"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-zinc-900 border border-zinc-800 w-full max-h-[80vh] shrink-0 rounded-3xl flex flex-col shadow-2xl transition-all ${isOverlay ? 'ring-2 ring-zinc-700 shadow-[0_20px_60px_rgba(0,0,0,0.8)] opacity-95 cursor-grabbing' : ''}`}
    >
      {/* Column Header */}
      <div 
        className="flex items-center justify-between p-4 px-5 border-b border-zinc-800/50 group bg-zinc-900/40 rounded-t-3xl cursor-grab touch-none"
        {...attributes}
        {...listeners}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); deleteColumn(column.id); }}
          className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 p-2 text-sm rounded-xl transition-colors cursor-pointer shrink-0 mr-2 border border-transparent hover:border-red-500/20"
        >
          <Trash2 size={16} />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <GripHorizontal size={16} className="text-zinc-600 group-hover:text-white transition-colors cursor-grab shrink-0" />
          <div className="bg-zinc-950 border border-zinc-800 text-zinc-400 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </div>
          <input 
            value={column.title}
            onChange={(e) => updateColumn(column.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className="bg-transparent focus:bg-zinc-950 text-white font-bold outline-none flex-1 truncate transition-colors rounded px-1.5 focus:border focus:ring-1 focus:ring-zinc-700/50 -ml-1.5 min-w-0"
          />
        </div>
      </div>

      {/* Task List container */}
      <div className="flex-1 overflow-y-auto subtle-scrollbar p-3 flex flex-col gap-3 min-h-[150px]">
        <SortableContext items={tasksIds}>
          {tasks.map(task => (
             <TaskCard 
               key={task.id} 
               task={task} 
               deleteTask={deleteTask} 
               updateTask={updateTask} 
               updateTaskColor={updateTaskColor}
             />
          ))}
        </SortableContext>
      </div>

      {/* Add Task footer */}
      <div className="p-3 border-t border-zinc-800/50">
        <button 
          onClick={() => createTask(column.id)}
          className="w-full border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-2xl p-4 flex items-center justify-center gap-2 font-bold text-sm transition-all"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>
    </div>
  );
}

// ---------------- TASK CARD COMPONENT ----------------

interface TaskProps {
  task: Task;
  deleteTask: (id: Id) => void;
  updateTask: (id: Id, content: string) => void;
  updateTaskColor: (id: Id, color: TaskColor) => void;
  isOverlay?: boolean;
}

function TaskCard({ task, deleteTask, updateTask, updateTaskColor, isOverlay }: TaskProps) {
  const [mouseIsOver, setMouseIsOver] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task }
  });

  const style = { 
    transition, 
    transform: CSS.Transform.toString(transform)
  };

  const toggleEditMode = () => {
    setEditMode(prev => !prev);
    setMouseIsOver(false);
    setShowOptions(false);
  };

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-30 border-2 border-emerald-500 bg-zinc-950 p-5 rounded-2xl h-[80px]" 
      />
    );
  }

  const colorStyles = {
    zinc: 'bg-zinc-950 hover:bg-[#111113] border-zinc-800 text-zinc-200',
    yellow: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 border-l-4 border-l-yellow-500 text-yellow-100',
    blue: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 border-l-4 border-l-blue-500 text-blue-100',
    emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 border-l-4 border-l-emerald-500 text-emerald-100',
    rose: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 border-l-4 border-l-rose-500 text-rose-100'
  };

  const currentColorStyle = colorStyles[task.color || 'zinc'];

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`border p-4 rounded-2xl cursor-grab active:cursor-grabbing shadow-sm relative group flex flex-col gap-2 transition-all min-h-[80px] touch-none
          ${currentColorStyle}
          ${isOverlay ? 'shadow-[0_20px_60px_rgba(0,0,0,0.8)] opacity-95 ring-2 ring-white/20 z-50' : ''}
          ${editMode ? 'ring-2 ring-zinc-500 bg-zinc-900 border-zinc-700' : ''}`}
      onContextMenu={(e) => { e.preventDefault(); toggleEditMode(); }}
      onMouseEnter={() => setMouseIsOver(true)}
      onMouseLeave={() => setMouseIsOver(false)}
      {...attributes}
      {...listeners}
    >
      {editMode ? (
        <textarea 
          autoFocus
          className="bg-transparent border-none outline-none resize-none w-full text-[15px] font-medium leading-relaxed placeholder-zinc-700"
          value={task.content}
          placeholder="What needs to be done?"
          onBlur={toggleEditMode}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              toggleEditMode();
            }
          }}
          onChange={(e) => updateTask(task.id, e.target.value)}
        />
      ) : (
        <p 
          className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed min-h-[40px]"
          onClick={(e) => {
            if (window.innerWidth < 768 && !showOptions) {
              setShowOptions(true);
            } else {
              toggleEditMode();
            }
          }}
        >
          {task.content || <span className="text-zinc-600 font-normal italic pointer-events-none">New note...</span>}
        </p>
      )}

      {/* Hover/Tap Toolbar */}
      {(mouseIsOver || showOptions) && !editMode && (
        <div 
          className="absolute left-3 top-3 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleEditMode(); }}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Edit (Right-Click)"
          >
            <GripVertical size={14} />
          </button>
          
          <div className="w-px h-4 bg-zinc-700/50 mx-1" />
          
          <div className="flex items-center gap-1.5 px-2">
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'zinc'); }} className="w-3 h-3 rounded-full bg-zinc-600 hover:scale-125 transition-transform" title="Zinc" />
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'yellow'); }} className="w-3 h-3 rounded-full bg-yellow-500 hover:scale-125 transition-transform" title="Yellow" />
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'blue'); }} className="w-3 h-3 rounded-full bg-blue-500 hover:scale-125 transition-transform" title="Blue" />
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'emerald'); }} className="w-3 h-3 rounded-full bg-emerald-500 hover:scale-125 transition-transform" title="Green" />
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'rose'); }} className="w-3 h-3 rounded-full bg-rose-500 hover:scale-125 transition-transform" title="Red" />
          </div>

          <div className="w-px h-4 bg-zinc-700/50 mx-1" />

          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteTask(task.id); }}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
