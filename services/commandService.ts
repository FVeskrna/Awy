export interface Command {
    id: string;
    label: string;
    category: 'Navigation' | 'Action' | 'Utility' | 'Focus';
    shortcut?: string;
    action: () => void;
}

type CommandListener = (commands: Command[]) => void;

class CommandService {
    private commands: Command[] = [];
    private listeners: CommandListener[] = [];

    constructor() {
        console.log('CommandService initialized');
    }

    registerCommand(command: Command) {
        // Prevent duplicates by ID
        if (this.commands.find(c => c.id === command.id)) {
            console.warn(`Command with id ${command.id} is already registered.`);
            return;
        }
        this.commands.push(command);
        this.notifyListeners();
    }

    unregisterCommand(commandId: string) {
        this.commands = this.commands.filter(c => c.id !== commandId);
        this.notifyListeners();
    }

    getCommands(): Command[] {
        return this.commands;
    }

    subscribe(listener: CommandListener) {
        this.listeners.push(listener);
        // Immediately invoke with current state
        listener(this.commands);

        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.commands));
    }
}

export const commandService = new CommandService();
