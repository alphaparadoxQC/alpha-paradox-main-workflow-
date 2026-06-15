from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import status, molecule, classical, quantum, builder, vqe

app = FastAPI(title="Quantum Chemistry Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status.router, prefix="/chemistry")
app.include_router(molecule.router, prefix="/chemistry")
app.include_router(classical.router, prefix="/chemistry")
app.include_router(quantum.router, prefix="/chemistry")
app.include_router(builder.router, prefix="/chemistry")
app.include_router(vqe.router, prefix="/chemistry/vqe")

@app.get("/")
def read_root():
    return {"message": "Quantum Chemistry Backend is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
