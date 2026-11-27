import os
import importlib.util

class PluginManager:
    def __init__(self, plugin_dir="plugins"):
        self.plugin_dir = plugin_dir
        self.plugins = {}

    def load_plugins(self):
        """Dynamically load python modules from the plugins directory."""
        if not os.path.exists(self.plugin_dir):
            return
            
        for filename in os.listdir(self.plugin_dir):
            if filename.endswith(".py") and filename != "__init__.py":
                module_name = filename[:-3]
                file_path = os.path.join(self.plugin_dir, filename)
                
                spec = importlib.util.spec_from_file_location(module_name, file_path)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                if hasattr(module, "register_plugin"):
                    plugin_info = module.register_plugin()
                    self.plugins[plugin_info['name']] = plugin_info

    def get_custom_gates(self):
        gates = {}
        for p in self.plugins.values():
            if 'gates' in p:
                gates.update(p['gates'])
        return gates
        
    def get_custom_pulses(self):
        pulses = {}
        for p in self.plugins.values():
            if 'pulses' in p:
                pulses.update(p['pulses'])
        return pulses

# Global instance
plugin_manager = PluginManager(os.path.join(os.path.dirname(__file__)))
plugin_manager.load_plugins()
