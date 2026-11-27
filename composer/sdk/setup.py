from setuptools import setup, find_packages

setup(
    name="alpha-paradox",
    version="1.0.0",
    description="Python SDK and CLI for the Alpha Enterprise Quantum Platform",
    author="Alpha Paradox",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.1"
    ],
    entry_points={
        "console_scripts": [
            "alpha=alpha_paradox.cli:main",
        ]
    }
)
