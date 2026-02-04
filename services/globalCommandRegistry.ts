import { commandService } from './commandService';

const NAV_PREFIX = 'Go to';
const ACTION_PREFIX = 'Create';

export const globalCommandRegistry = {
    register: () => {
        // --- Navigation Commands ---
        const navs = [
            { id: 'nav-home', label: `${NAV_PREFIX} Home / Dashboard`, shortcut: 'G H', view: 'dashboard' },
            { id: 'nav-tasks', label: `${NAV_PREFIX} Tasks`, shortcut: 'G T', view: 'tasks' },
            { id: 'nav-fridge', label: `${NAV_PREFIX} Fridge`, shortcut: 'G F', view: 'fridge' },
            { id: 'nav-assets', label: `${NAV_PREFIX} Assets`, shortcut: 'G A', view: 'asset' },
            { id: 'nav-meeting', label: `${NAV_PREFIX} Navigator`, shortcut: 'G N', view: 'meeting' },
            { id: 'nav-deepwork', label: 'Enter Focus Mode', category: 'Focus', shortcut: 'G D', view: 'deepwork' },
        ];

        navs.forEach(n => {
            commandService.registerCommand({
                id: n.id,
                label: n.label,
                category: (n as any).category || 'Navigation',
                shortcut: n.shortcut,
                action: () => {
                    window.location.hash = `#${n.view}`;
                }
            });
        });

        // --- Global Creation Actions ---
        // These warp to the module AND trigger the creation modal via URL param
        const actions = [
            { id: 'act-task', label: `${ACTION_PREFIX} New Task`, shortcut: 'Cmd+N', view: 'tasks', param: 'action=create' },
            { id: 'act-snippet', label: `${ACTION_PREFIX} New Snippet`, view: 'fridge', param: 'action=create' },
            { id: 'act-asset', label: `${ACTION_PREFIX} New Asset`, view: 'asset', param: 'action=create' },
            { id: 'act-node', label: 'Configure Time Nodes', view: 'meeting', param: 'action=config' },
        ];

        actions.forEach(a => {
            commandService.registerCommand({
                id: a.id,
                label: a.label,
                category: 'Action',
                shortcut: a.shortcut,
                action: () => {
                    // Force a hash change event even if we are already on the view
                    const newHash = `#${a.view}?${a.param}`;
                    if (window.location.hash === newHash) {
                        // If already there, trigger a manual dispatch or just ensure the component reacts
                        // For now, simpler is creating a unique event or just toggling
                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                    } else {
                        window.location.hash = newHash;
                    }
                }
            });
        });
    },

    unregister: () => {
        // Clean up if needed (usually on app unmount, which rarely happens)
        const ids = [
            'nav-home', 'nav-tasks', 'nav-fridge', 'nav-assets', 'nav-meeting', 'nav-deepwork',
            'act-task', 'act-snippet', 'act-asset', 'act-node'
        ];
        ids.forEach(id => commandService.unregisterCommand(id));
    }
};
