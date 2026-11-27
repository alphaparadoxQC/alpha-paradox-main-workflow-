def generate_noise_model(layout_components: list) -> dict:
    """
    Generates a physical noise model (T1, T2, thermal population) 
    based on the geometric parameters of the layout components.
    """
    noise_profiles = {}
    
    for comp in layout_components:
        if comp.get('type') in ['transmon_cross', 'fluxonium']:
            qid = comp.get('id')
            p = comp.get('params', {})
            
            # Simplified physics heuristic: 
            # Larger gap size -> less dielectric surface participation -> higher T1
            gap = p.get('gap_size', 20)
            t1_estimate = 50.0 + (gap * 1.5) # microseconds
            t2_estimate = t1_estimate * 1.2 # roughly 
            
            noise_profiles[qid] = {
                "T1_us": round(t1_estimate, 2),
                "T2_us": round(t2_estimate, 2),
                "thermal_population": 0.01
            }
            
    return {
        "model_type": "geometric_dielectric_loss",
        "qubit_noise": noise_profiles
    }
