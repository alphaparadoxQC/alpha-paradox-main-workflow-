import argparse
import json
import sys
from .client import AlphaClient

def main():
    parser = argparse.ArgumentParser(description="Alpha Paradox Quantum CLI")
    parser.add_argument("--url", default="http://localhost:8000", help="API Gateway URL")
    parser.add_argument("--key", default="", help="API Key or JWT Token")
    
    subparsers = parser.add_subparsers(dest="command")

    # Run QASM command
    qasm_parser = subparsers.add_parser("run-qasm")
    qasm_parser.add_argument("file", help="Path to .qasm file")
    qasm_parser.add_argument("--backend", default="aer_statevector", help="Backend name")
    qasm_parser.add_argument("--shots", type=int, default=1024, help="Number of shots")

    # Run Analog command
    analog_parser = subparsers.add_parser("run-analog")
    analog_parser.add_argument("file", help="Path to .json analog payload")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    client = AlphaClient(api_url=args.url, api_key=args.key)

    try:
        if args.command == "run-qasm":
            with open(args.file, 'r') as f:
                code = f.read()
            result = client.run_circuit(code, args.backend, args.shots)
            print(json.dumps(result, indent=2))
            
        elif args.command == "run-analog":
            with open(args.file, 'r') as f:
                payload = json.load(f)
            result = client.run_analog(payload)
            print(json.dumps(result, indent=2))
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
