export const QUANTUM_REGISTRY = [
  // ==========================================
  // CHEMISTRY SIMULATION
  // ==========================================
  {
    name: 'H2 Molecule Simulation (VQE)',
    author: 'qiskit_nature',
    votes: 3450,
    category: 'Chemistry Simulation',
    date: '2023-11-15',
    code: `import warnings
warnings.filterwarnings('ignore')

from qiskit_nature.second_q.drivers import PySCFDriver
from qiskit_nature.second_q.mappers import JordanWignerMapper
from qiskit_nature.second_q.circuit.library import UCCSD, HartreeFock
from qiskit_algorithms import VQE
from qiskit_algorithms.optimizers import SLSQP
from alpha.primitives import StatevectorEstimator as Estimator

driver = PySCFDriver(atom="H 0 0 0; H 0 0 0.735", basis="sto3g")
problem = driver.run()
mapper = JordanWignerMapper()

fermionic_op = problem.hamiltonian.second_q_op()
qubit_op = mapper.map(fermionic_op)

ansatz = UCCSD(
    problem.num_spatial_orbitals,
    problem.num_particles,
    mapper,
    initial_state=HartreeFock(
        problem.num_spatial_orbitals,
        problem.num_particles,
        mapper,
    ),
)

vqe = VQE(Estimator(), ansatz, SLSQP())
result = vqe.compute_minimum_eigenvalue(qubit_op)
print(f"Ground state energy: {result.eigenvalue.real}")`,
    meta: 'Alpha Nature, UCCSD'
  },
  {
    name: 'Water (H2O) Active Space',
    author: 'open_fermion',
    votes: 2900,
    category: 'Chemistry Simulation',
    date: '2024-01-20',
    code: `import openfermion
from openfermion.chem import MolecularData
from openfermionpyscf import run_pyscf

# Define water molecule geometry
geometry = [('O', (0., 0., 0.)),
            ('H', (0.757, 0.586, 0.)),
            ('H', (-0.757, 0.586, 0.))]
basis = 'sto-3g'
multiplicity = 1
charge = 0

molecule = MolecularData(geometry, basis, multiplicity, charge)
molecule = run_pyscf(molecule, run_scf=1, run_mp2=1, run_cisd=1, run_ccsd=1, run_fci=1)

# Active space: freeze core oxygen orbital, keep 4 valence orbitals
active_space_start = 1
active_space_stop = 5
molecular_hamiltonian = molecule.get_molecular_hamiltonian(
    occupied_indices=range(active_space_start),
    active_indices=range(active_space_start, active_space_stop)
)
print("Fermionic Hamiltonian constructed.")`,
    meta: 'Active Space, OpenFermion'
  },
  {
    name: 'BeH2 Reaction Pathway',
    author: 'pennylane_chem',
    votes: 2150,
    category: 'Chemistry Simulation',
    date: '2023-08-05',
    code: `import pennylane as qml
from pennylane import qchem

symbols = ["Be", "H", "H"]
coordinates = np.array([0.0, 0.0, 0.0, 0.0, 0.0, 1.3, 0.0, 0.0, -1.3])

H, qubits = qchem.molecular_hamiltonian(symbols, coordinates)
print(f"Qubits required: {qubits}")

dev = qml.device("default.qubit", wires=qubits)

@qml.qnode(dev)
def cost_fn(param):
    qml.BasisState(qchem.hf_state(4, qubits), wires=range(qubits))
    qml.DoubleExcitation(param, wires=[0, 1, 2, 3])
    return qml.expval(H)

print("Setup for geometry optimization ready.")`,
    meta: 'PennyLane, Reaction Path'
  },

  // ==========================================
  // NOVEL COMPONENT DISCOVERY
  // ==========================================
  {
    name: 'VQC for Drug Discovery',
    author: 'qiskit_machine_learning',
    votes: 4100,
    category: 'Novel Component Discovery',
    date: '2024-03-10',
    code: `import numpy as np
import warnings
warnings.filterwarnings('ignore')

from alpha.circuit.library import ZZFeatureMap, RealAmplitudes
from qiskit_machine_learning.algorithms import VQC
from alpha.primitives import StatevectorSampler as Sampler

num_features = 2
feature_map = ZZFeatureMap(feature_dimension=num_features, reps=1)
ansatz = RealAmplitudes(num_qubits=num_features, reps=1)

vqc = VQC(feature_map=feature_map, ansatz=ansatz, sampler=Sampler())

print("Generating mock molecular feature data...")
X_train = np.random.rand(10, num_features)
y_train = np.array([0, 1, 0, 1, 0, 1, 0, 1, 0, 1])

print("Training Variational Quantum Classifier (VQC)...")
vqc.fit(X_train, y_train)
score = vqc.score(X_train, y_train)
print(f"VQC model trained successfully! Training Score: {score * 100:.2f}%")`,
    meta: 'VQC, Drug Features'
  },
  {
    name: 'Quantum Kernel Method (QSVM) for Toxicity',
    author: 'alpha_paradox_lab',
    votes: 3850,
    category: 'Novel Component Discovery',
    date: '2024-04-22',
    code: `import numpy as np
import warnings
warnings.filterwarnings('ignore')

from alpha.circuit.library import ZZFeatureMap
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from sklearn.svm import SVC

# Encode molecular fingerprints into quantum states
print("Initializing Quantum Kernel...")
feature_map = ZZFeatureMap(feature_dimension=2, reps=1, entanglement='linear')
qkernel = FidelityQuantumKernel(feature_map=feature_map)

print("Generating mock training data (toxicity dataset)...")
X_train = np.random.rand(10, 2)
y_train = np.array([0, 1, 0, 1, 0, 1, 0, 1, 0, 1])

# Mock training on toxicity dataset
qsvm = SVC(kernel=qkernel.evaluate)
print("Training Quantum Support Vector Machine...")
qsvm.fit(X_train, y_train)
score = qsvm.score(X_train, y_train)

print(f"QSVM ready for toxicity classification. Accuracy: {score * 100:.2f}%")`,
    meta: 'QSVM, Toxicity'
  },
  {
    name: 'Material Property Prediction (QNN)',
    author: 'alpha_paradox_lab',
    votes: 3200,
    category: 'Novel Component Discovery',
    date: '2023-12-01',
    code: `import torch
import warnings
warnings.filterwarnings('ignore')

from qiskit_machine_learning.neural_networks import SamplerQNN
from alpha.circuit import ParameterVector, QuantumCircuit

num_qubits = 2
qc = QuantumCircuit(num_qubits)
inputs = ParameterVector('input', num_qubits)
weights = ParameterVector('weight', num_qubits)

for i in range(num_qubits):
    qc.ry(inputs[i], i)
    qc.rz(weights[i], i)
qc.cx(0, 1)

qnn = SamplerQNN(circuit=qc, input_params=inputs, weight_params=weights)
print("Quantum Neural Network for predicting material bandgaps initialized.")

# Generate mock data and do a forward pass
mock_input = torch.rand(1, num_qubits)
mock_weights = torch.rand(num_qubits)
output = qnn.forward(mock_input, mock_weights)
print(f"Forward pass successful! Evaluated output:\\n{output}")`,
    meta: 'QNN, Material Science'
  },

  // ==========================================
  // PRE-TRAINED VQAs
  // ==========================================
  {
    name: 'QAOA MaxCut (4 Node Graph)',
    author: 'ibm_quantum',
    votes: 1850,
    category: 'Pre-trained VQAs',
    date: '2023-09-12',
    code: `import warnings
warnings.filterwarnings('ignore')

from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA
from alpha.primitives import StatevectorSampler as Sampler
from alpha.quantum_info import SparsePauliOp

# 4-node ring graph MaxCut Hamiltonian
hamiltonian = SparsePauliOp.from_list([('ZZII', -0.5), ('IZZI', -0.5), ('IIZZ', -0.5), ('ZIIZ', -0.5), ('IIII', 2.0)])

# Load pre-trained parameters
gamma = [0.4]
beta = [0.8]

print("Initializing QAOA with pre-trained parameters...")
qaoa = QAOA(sampler=Sampler(), reps=1, optimizer=COBYLA(maxiter=0), initial_point=gamma + beta)

result = qaoa.compute_minimum_eigenvalue(hamiltonian)
print(f"QAOA evaluated energy: {result.eigenvalue.real}")`,
    meta: 'Depth 1, MaxCut'
  },
  {
    name: 'VQE Ansatz (Hardware Efficient)',
    author: 'alpha_paradox_lab',
    votes: 1600,
    category: 'Pre-trained VQAs',
    date: '2024-01-05',
    code: `import warnings
warnings.filterwarnings('ignore')
from alpha.circuit.library import EfficientSU2

ansatz = EfficientSU2(num_qubits=8, su2_gates=['ry', 'rz'], entanglement='circular', reps=4)

print(f"8-qubit Hardware Efficient Ansatz constructed!")
print(f"Circuit Depth: {ansatz.depth()}")
print(f"Total Trainable Parameters: {ansatz.num_parameters}")`,
    meta: '8 Qubits, 4 Reps'
  }
];
