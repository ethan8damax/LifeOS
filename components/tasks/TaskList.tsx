import TaskRow from '@/components/tasks/TaskRow'
import type { Task } from '@/types'

interface TaskListProps {
  tasks:    Task[]
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-[13px] text-foreground-tertiary py-1">No tasks here.</p>
    )
  }

  return (
    <div>
      {tasks.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
