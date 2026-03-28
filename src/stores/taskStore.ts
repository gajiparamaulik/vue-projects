import { defineStore } from 'pinia'
import type { Task } from '../types/task'

export const useTaskStore = defineStore('task', {
    state: () => ({
        tasks: JSON.parse(localStorage.getItem('tasks') || '[]') as Task[]
    }),

    getters: {
        completedTasks: (state) => state.tasks.filter(t => t.completed),
        pendingTasks: (state) => state.tasks.filter(t => !t.completed)
    },

    actions: {
        addTasks(title: string, priority: Task['priority']) {
            const newTask: Task = {
                id: Date.now(),
                title,
                completed: false,
                priority
            }
            this.tasks.push(newTask);
            this.saveToLocalStorage();
        },

        toggleTask(id: number) {
            const task = this.tasks.find(t => t.id === id);
            if(task) {
                task.completed = !task.completed
                this.saveToLocalStorage();
            }
        },

        deleteTask(id: number) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveToLocalStorage();
        },

        saveToLocalStorage() {
            localStorage.setItem('tasks', JSON.stringify(this.tasks))
        },

        loadFromLocalStorage() {
            const data = localStorage.getItem('tasks');
            if(data) {
                this.tasks = JSON.parse(data);
            }
        }
        
    }
})