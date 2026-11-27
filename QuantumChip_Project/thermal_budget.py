def calculate_thermal_budget():
    print("=== 1100-Qubit Chip Thermal Budget Analysis ===")
    
    # Fridge cooling power at Mixing Chamber (MXC) at 20 mK
    cooling_power_mxc_nW = 15000.0 # 15 uW
    
    # Line counts
    readout_lines = 110 # Multiplexed
    xy_drive_lines = 1100
    z_flux_lines = 1100 + 2090 # Qubits + Couplers
    
    total_lines = readout_lines + xy_drive_lines + z_flux_lines
    print(f"Total RF/DC Lines: {total_lines}")
    
    # Heat per line at MXC (using 0.86 mm CuNi or NbTi coax)
    # Assuming proper thermal anchoring and attenuation (e.g. 20dB at 4K, 20dB at 100mK, 10dB at MXC)
    # Passive conductive heat load per superconducting line from 100mK to 20mK is ~0.1 nW
    # Active dissipation per flux line (DC current) is ~0.5 nW
    # Active dissipation per XY line (microwave pulses) is ~0.2 nW
    
    passive_load_per_line = 0.1
    active_xy_load = 0.2
    active_z_load = 0.5
    
    total_passive_load = total_lines * passive_load_per_line
    total_xy_load = xy_drive_lines * active_xy_load
    total_z_load = z_flux_lines * active_z_load
    
    total_heat_load_nW = total_passive_load + total_xy_load + total_z_load
    
    print(f"Passive Conductive Load (100mK -> MXC): {total_passive_load} nW")
    print(f"Active XY Drive Load: {total_xy_load} nW")
    print(f"Active Z Flux Load: {total_z_load} nW")
    print(f"---")
    print(f"Total Heat Load at MXC: {total_heat_load_nW} nW ({total_heat_load_nW / 1000.0:.2f} uW)")
    
    print(f"Fridge Cooling Power: {cooling_power_mxc_nW} nW ({cooling_power_mxc_nW / 1000.0:.2f} uW)")
    
    if total_heat_load_nW < cooling_power_mxc_nW:
        print("Verdict: PASS - The fridge can cool this chip.")
        print("Recommendation: Use Niobium-Titanium (NbTi) superconducting coax from 4K down to MXC to minimize thermal conductivity.")
    else:
        print("Verdict: FAIL - Heat load exceeds cooling power.")

if __name__ == "__main__":
    calculate_thermal_budget()
