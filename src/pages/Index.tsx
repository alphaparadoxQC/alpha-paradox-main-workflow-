 import { useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { QuantumCircuitBuilder } from '@/components/quantum';
 import { useAuth } from '@/hooks/useAuth';
 import { Loader2 } from 'lucide-react';
 import { SEO } from '@/components/shared/SEO';

const Index = () => {
   const { user, loading } = useAuth();
   const navigate = useNavigate();
 
   useEffect(() => {
     if (!loading && !user) {
       // Store current path for redirect after login
       sessionStorage.setItem('returnUrl', window.location.pathname);
       navigate('/auth', { replace: true, state: { returnTo: '/builder' } });
     }
   }, [user, loading, navigate]);
 
   // Show loading while checking auth
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   // Don't render if not authenticated
   if (!user) {
     return null;
   }
 
   return (
     <>
       <SEO 
         title="Quantum Circuit Builder — Drag & Drop Quantum Computing | Alpha ParadoxQC"
         description="Build, simulate, and visualize quantum circuits in your browser. Drag-and-drop gates, real-time Bloch spheres, state vector and MPS simulation up to 100 qubits."
         canonical="/builder"
         structuredData={{
           "@context": "https://schema.org",
           "@graph": [
             {
               "@type": "SoftwareApplication",
               "name": "Alpha ParadoxQC Quantum Circuit Builder",
               "applicationCategory": "DeveloperApplication",
               "operatingSystem": "Web"
             },
             {
               "@type": "FAQPage",
               "mainEntity": [
                 {
                   "@type": "Question",
                   "name": "What is the Quantum Circuit Builder?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "The Alpha ParadoxQC Quantum Circuit Builder is a visual platform designed to simplify the creation, visualization, and exploration of quantum circuits. It aims to help students, researchers, educators, and developers design quantum algorithms through an intuitive interface."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Who is this platform designed for?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "The platform is intended for a wide range of users, including students, researchers, educators, developers, startups, and organizations interested in quantum computing."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Why did Alpha ParadoxQC build this platform?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "Quantum programming can be difficult for newcomers. Our goal is to reduce the learning curve by providing tools that make quantum circuit design more accessible while supporting experimentation and research."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Do I need programming experience?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "The platform is being designed to support users with different experience levels. Visual tools can help beginners, while more advanced capabilities may be available for experienced developers."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Can I design my own quantum circuits?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "Yes. The platform is intended to let users create and modify quantum circuits for learning, experimentation, and algorithm development."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Can I simulate my circuits?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "The platform is planned to include simulation capabilities so users can study circuit behavior before running experiments on quantum hardware, where supported."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Which quantum gates will be available?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "The platform is expected to support commonly used quantum gates such as Pauli gates, Hadamard, Phase, Rotation, CNOT, SWAP, Toffoli, and measurement operations. The exact feature set will depend on the released version."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Can I export my circuit?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "Export options are planned to support interoperability with selected quantum development workflows. Available formats will be documented as features are released."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Is the platform suitable for education?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "Yes. One of our objectives is to provide an environment that supports teaching, learning, and practical exploration of quantum computing concepts."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Is this a cloud-based platform?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "Deployment options will depend on the product release. Details about supported environments will be announced as development progresses."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "How can I request a demonstration?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "You can contact the Alpha ParadoxQC team through our website to learn about demonstrations, collaborations, or early access opportunities when available."
                   }
                 },
                 {
                   "@type": "Question",
                   "name": "Where can I learn more?",
                   "acceptedAnswer": {
                     "@type": "Answer",
                     "text": "Our documentation, tutorials, technical blogs, and knowledge center will provide guides, updates, and educational resources as the platform evolves."
                   }
                 }
               ]
             }
           ]
         }}
       />
       <QuantumCircuitBuilder />
     </>
   );
};

export default Index;
