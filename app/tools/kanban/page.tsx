"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
import { Plus, Trash2, GripVertical, GripHorizontal, Info, Zap, ArrowLeft, HelpCircle, KanbanSquare } from "lucide-react";
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

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

.ig-root {
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #000;
}
.ig-display {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  letter-spacing: -0.02em;
}
.ig-label {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 10px;
  color: #000;
}
.ig-btn {
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.ig-btn:active {
  transform: translate(1px, 1px) !important;
  box-shadow: none !important;
}
`;

export default function KanbanPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showHelp, setShowHelp] = useState(false);

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

  if (!isClient) return <div className="min-h-screen bg-[#F4ECD8] py-20 px-8 flex justify-center items-center"><div className="w-8 h-8 rounded-full border-t-2 border-black animate-spin"></div></div>;

  const createColumn = () => {
    const newCol: Column = { id: generateId(), title: `Column ${columns.length + 1}` };
    setColumns([...columns, newCol]);
  };

  const deleteColumn = (id: Id) => {
    setColumns(columns.filter((c) => c.id !== id));
    setTasks(tasks.filter((t) => t.columnId !== id));
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
    <div className="min-h-screen bg-[#F4ECD8] text-black font-sans pb-24 relative overflow-hidden ig-root">
      <style>{GLOBAL_STYLES}</style>

      {/* Header */}
      <header className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
        <Link
          href="/tools"
          className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
        >
          <ArrowLeft size={12} strokeWidth={2.5} /> BACK
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black border-2 border-black shadow-[2.5px_2.5px_0_#000] bg-orange-500">
            <KanbanSquare size={14} />
          </div>
          <span className="ig-display text-sm sm:text-lg font-black tracking-tight text-black">
            Kanban Board
          </span>
          <button 
            onClick={() => setShowHelp(true)}
            className="p-1 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
            title="Help"
          >
            <HelpCircle size={12} />
          </button>
        </div>
      </header>

      <div className="w-full mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center px-4 max-w-[1600px] mx-auto mt-6">
        <div>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-1">Productivity</p>
          <h2 className="text-3xl font-black text-black tracking-tighter ig-display">Task Workspace</h2>
          <p className="text-zinc-500 font-semibold tracking-wide text-xs">Organize tasks, track progress. 100% local and private.</p>
        </div>
        <button 
          onClick={createColumn}
          className="ig-btn bg-white hover:bg-zinc-50 text-black px-6 py-3 rounded-xl border-2 border-black font-black text-xs uppercase tracking-widest hover:bg-[#e8e5e0] transition-colors flex items-center gap-2 shadow-[3px_3px_0_#000]"
        >
          <Plus size={14} strokeWidth={3} /> Add List
        </button>
      </div>

      {/* Board Canvas */}
      <div className="w-full relative z-10 px-4 max-w-[1600px] mx-auto pb-20">
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
        title="Kanban Board Specs"
      >
        <div className="space-y-8 text-left max-w-2xl mx-auto py-4">
            <section className="space-y-3">
                <h3 className="text-lg font-bold text-black ig-display">Organize Your Workflow Privately</h3>
                <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                    The Kanban Board provides a modern, interactive workspace to capture and structure your tasks using draggable notes. It runs entirely inside your browser, caching your changes locally for complete security.
                </p>
            </section>
            
            <section className="space-y-3">
                <h3 className="text-lg font-bold text-black ig-display">Frequently Asked Questions</h3>
                <LocalAccordion>
                    <LocalAccordionItem title="How do I change task sticky note colors?">
                        Hover over any task card (or tap it on mobile) to display the editing overlay, which contains 5 color choices (Zinc, Yellow, Blue, Green, Red) to customize your priority mapping.
                    </LocalAccordionItem>
                    <LocalAccordionItem title="Where is my task data stored?">
                        This application enforces a strict client-side data architecture. Your columns, boards, and sticky notes are serialized into your browser's local storage and never transmitted to our servers.
                    </LocalAccordionItem>
                    <LocalAccordionItem title="How do I rename lists/columns?">
                        Simply click the header input text ("To Do", "In Progress", etc.) and begin typing. Click the delete bin icon inside any column header to remove it and its tasks.
                    </LocalAccordionItem>
                </LocalAccordion>
            </section>
        </div>
      </HelpModal>

      <style dangerouslySetInnerHTML={{__html:`
        .subtle-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .subtle-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .subtle-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 9999px; }
        .subtle-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
      `}} />
    </div>
  );
}

// ---------------- LOCAL ACCORDION COMPONENTS ----------------
function LocalAccordion({ children }: { children: React.ReactNode }) {
    return <div className="space-y-3 w-full">{children}</div>;
}

interface LocalAccordionItemProps {
    title: string;
    children: React.ReactNode;
}

function LocalAccordionItem({ title, children }: LocalAccordionItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-2 border-black rounded-2xl bg-zinc-50 overflow-hidden shadow-[3px_3px_0_#000] transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between text-left transition-all hover:bg-zinc-100"
            >
                <span className="font-bold text-sm text-black pr-4">
                    {title}
                </span>
                <span className={`text-black shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                    ▼
                </span>
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[300px] border-t-2 border-black bg-white" : "max-h-0"
                }`}
            >
                <div className="p-4 text-xs text-zinc-650 leading-relaxed font-medium">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ---------------- COLUMN CONTAINER COMPONENT ----------------
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
        className="opacity-30 border-2 border-dashed border-black bg-transparent w-full shrink-0 h-[70vh] rounded-3xl"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white border-2 border-black w-full max-h-[75vh] shrink-0 rounded-3xl flex flex-col shadow-[4px_4px_0_#000] transition-all ${isOverlay ? 'shadow-[8px_8px_0_#000] scale-102 cursor-grabbing' : ''}`}
    >
      {/* Column Header */}
      <div 
        className="flex items-center justify-between p-3.5 px-4 border-b-2 border-black bg-zinc-50/50 rounded-t-[1.3rem] cursor-grab touch-none"
        {...attributes}
        {...listeners}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); deleteColumn(column.id); }}
          className="text-zinc-400 hover:text-rose-600 p-1.5 border-2 border-transparent hover:border-black rounded-lg hover:bg-rose-50 transition-all cursor-pointer shrink-0 mr-1"
        >
          <Trash2 size={13} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripHorizontal size={14} className="text-zinc-400 cursor-grab shrink-0" />
          <div className="bg-white border-2 border-black text-black font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 shadow-[1px_1px_0_#000]">
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
            className="bg-transparent focus:bg-white text-black font-bold outline-none flex-1 truncate transition-all rounded px-1.5 border border-transparent focus:border-black focus:ring-1 focus:ring-black -ml-1 min-w-0 text-sm"
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
      <div className="p-3 border-t-2 border-black">
        <button 
          onClick={() => createTask(column.id)}
          className="ig-btn w-full border-2 border-dashed border-black hover:bg-zinc-50 text-black hover:border-solid rounded-xl p-3 flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-widest transition-all shadow-[2px_2px_0_#000]"
        >
          <Plus size={14} strokeWidth={3} /> Add Task
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
        className="opacity-30 border-2 border-black bg-[#f1f5f9] p-4 rounded-xl h-[80px]" 
      />
    );
  }

  const colorStyles = {
    zinc: 'bg-white text-black border-zinc-350',
    yellow: 'bg-yellow-50 border-l-4 border-l-yellow-500 border-yellow-200 text-yellow-950',
    blue: 'bg-blue-50 border-l-4 border-l-blue-500 border-blue-200 text-blue-950',
    emerald: 'bg-emerald-50 border-l-4 border-l-emerald-500 border-emerald-200 text-emerald-950',
    rose: 'bg-rose-50 border-l-4 border-l-rose-500 border-rose-200 text-rose-950'
  };

  const currentColorStyle = colorStyles[task.color || 'zinc'];

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`border-2 border-black p-4 rounded-2xl cursor-grab active:cursor-grabbing shadow-[2px_2px_0_#000] relative group flex flex-col gap-2 transition-all min-h-[80px] touch-none
          ${currentColorStyle}
          ${isOverlay ? 'shadow-[4px_4px_0_#000] scale-102 z-50' : ''}
          ${editMode ? 'bg-white border-black shadow-none translate-x-[1px] translate-y-[1px]' : ''}`}
      onContextMenu={(e) => { e.preventDefault(); toggleEditMode(); }}
      onMouseEnter={() => setMouseIsOver(true)}
      onMouseLeave={() => setMouseIsOver(false)}
      {...attributes}
      {...listeners}
    >
      {editMode ? (
        <textarea 
          autoFocus
          className="bg-transparent border-none outline-none resize-none w-full text-[14px] font-bold leading-relaxed text-black placeholder-zinc-300"
          value={task.content}
          placeholder="Enter task text..."
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
          className="whitespace-pre-wrap text-[14px] font-bold leading-relaxed min-h-[40px]"
          onClick={() => {
            if (window.innerWidth < 768 && !showOptions) {
              setShowOptions(true);
            } else {
              toggleEditMode();
            }
          }}
        >
          {task.content || <span className="text-zinc-300 font-normal italic pointer-events-none">New task card...</span>}
        </p>
      )}

      {/* Hover/Tap Toolbar */}
      {(mouseIsOver || showOptions) && !editMode && (
        <div 
          className="absolute left-2.5 top-2 bg-white border-2 border-black rounded-lg flex items-center shadow-[2px_2px_0_#000] overflow-hidden z-50 h-8"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleEditMode(); }}
            className="p-1 hover:bg-zinc-100 text-black transition-colors"
            title="Edit"
          >
            <GripVertical size={13} />
          </button>
          
          <div className="w-[2px] h-3 bg-black mx-1" />
          
          <div className="flex items-center gap-1 px-1">
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'zinc'); }} className="w-2.5 h-2.5 rounded-full bg-zinc-400 border border-black hover:scale-125 transition-transform" title="Default" />
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'yellow'); }} className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black hover:scale-125 transition-transform" title="Yellow" />
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'blue'); }} className="w-2.5 h-2.5 rounded-full bg-blue-400 border border-black hover:scale-125 transition-transform" title="Blue" />
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'emerald'); }} className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black hover:scale-125 transition-transform" title="Green" />
             <button onClick={(e) => { e.stopPropagation(); updateTaskColor(task.id, 'rose'); }} className="w-2.5 h-2.5 rounded-full bg-rose-450 border border-black hover:scale-125 transition-transform" title="Red" />
          </div>

          <div className="w-[2px] h-3 bg-black mx-1" />

          <button 
            onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
            className="p-1 hover:bg-rose-50 text-rose-600 transition-colors"
            title="Delete task"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
