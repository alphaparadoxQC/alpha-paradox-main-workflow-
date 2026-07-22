import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowRight, Building2, Users, MapPin, Mail, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/shared/SEO';

export default function About() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO 
        title="About Us | Alpha ParadoxQC"
        description="Learn about Alpha ParadoxQC's mission to bridge advanced quantum research with practical innovation. Meet our leadership and explore our company details."
        canonical="/about"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "mainEntity": {
            "@type": "Organization",
            "name": "ALPHA PARADOXQC PRIVATE LIMITED",
            "url": "https://alphaparadoxqc.com",
            "logo": "https://alphaparadoxqc.com/logo.png",
            "foundingDate": "2026-07-04",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "3/1, West Kamarthuba Road, Po and Pnr. Anita Anustan Grih, Habra",
              "addressLocality": "Habra - I",
              "addressRegion": "West Bengal",
              "postalCode": "743263",
              "addressCountry": "IN"
            },
            "contactPoint": [
              {
                "@type": "ContactPoint",
                "email": "quantum@alphaparadoxqc.com",
                "contactType": "customer service"
              }
            ],
            "founder": [
              {
                "@type": "Person",
                "name": "Sourojit Mondal",
                "jobTitle": "Founder & CEO"
              },
              {
                "@type": "Person",
                "name": "Debanjan Paul",
                "jobTitle": "Co-Founder & COO"
              }
            ]
          }
        }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3">
          <Link to="/">
            <img
              src="/logo.png"
              alt="Alpha Paradox Logo"
              className="h-8 w-auto object-contain hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Home</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/gallery">Gallery</Link>
          </Button>
          {user ? (
            <Button size="sm" onClick={() => navigate('/builder')}>
              Open Builder <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          )}
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black mb-6"
          >
            About <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Alpha ParadoxQC</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Bridging Advanced Quantum Research with Practical Innovation
          </motion.p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-24 space-y-16">
        
        {/* Company Information */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Company Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="group p-6 border border-border/50 rounded-2xl bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-center">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2 font-medium tracking-wide uppercase"><FileText className="w-4 h-4 text-primary"/> Company Name</div>
              <div className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">ALPHA PARADOXQC PRIVATE LIMITED</div>
            </div>
            <div className="group p-6 border border-border/50 rounded-2xl bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-center">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2 font-medium tracking-wide uppercase"><MapPin className="w-4 h-4 text-primary"/> Registered Address</div>
              <div className="font-medium leading-relaxed text-foreground/90">
                3/1, West Kamarthuba Road, Po and Pnr. Anita Anustan Grih, Habra,<br />
                North 24 Parganas, Habra - I, West Bengal, India, 743263
              </div>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl font-bold">Leadership & Board of Directors</h2>
          </div>
          <div className="space-y-8">
            
            {/* Sourojit Mondal */}
            <div className="p-8 border border-border/50 rounded-3xl bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
              <h3 className="text-xl font-bold text-primary mb-1">Sourojit Mondal</h3>
              <div className="text-sm text-muted-foreground mb-4">Founder & Chief Executive Officer (CEO)</div>
              <p className="text-sm leading-relaxed mb-4 text-foreground/80">
                Sourojit Mondal is the Founder and Chief Executive Officer of Alpha ParadoxQC. He leads the
                company's strategic vision, innovation roadmap, and long-term direction, guiding the organization in
                developing advanced quantum computing technologies and building sustainable solutions for scientific
                research and industry.
              </p>
              <p className="text-sm leading-relaxed mb-4 text-foreground/80">
                As CEO, he is responsible for defining corporate strategy, identifying new business opportunities,
                fostering strategic partnerships, and driving the company's growth. He works closely with the leadership,
                engineering, and research teams to align technological innovation with business objectives while
                representing Alpha ParadoxQC across industry, academic, and investment communities.
              </p>
              <h4 className="text-sm font-semibold mb-2">Key Responsibilities:</h4>
              <ul className="text-sm text-foreground/80 space-y-2 list-disc pl-4 marker:text-primary">
                <li>Define and lead the company's long-term vision and strategic direction.</li>
                <li>Drive innovation and identify emerging opportunities in quantum computing and deep technology.</li>
                <li>Develop strategic partnerships with industry, academia, government, and research organizations.</li>
                <li>Lead corporate growth, fundraising, and investor relations.</li>
                <li>Guide the company's product strategy and long-term technology roadmap.</li>
                <li>Represent Alpha ParadoxQC at conferences, industry events, and strategic engagements.</li>
                <li>Build a culture of innovation, collaboration, and responsible technological development.</li>
                <li>Ensure the organization maintains high standards of leadership, governance, and execution.</li>
              </ul>
            </div>

            {/* Debanjan Paul */}
            <div className="p-8 border border-border/50 rounded-3xl bg-card hover:border-secondary/40 hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300 group">
              <h3 className="text-xl font-bold text-secondary mb-1">Debanjan Paul</h3>
              <div className="text-sm text-muted-foreground mb-4">Co-Founder & Chief Operating Officer (COO)</div>
              <p className="text-sm leading-relaxed mb-4 text-foreground/80">
                Debanjan Paul is the Co-Founder and Chief Operating Officer of Alpha ParadoxQC. He is responsible for
                overseeing the company's day-to-day operations, business execution, and organizational growth.
                Working closely with the leadership team, he helps transform the company's strategic vision into practical
                execution while ensuring efficient coordination across teams.
              </p>
              <p className="text-sm leading-relaxed mb-4 text-foreground/80">
                His responsibilities include operational management, business development, strategic planning,
                partnership coordination, market expansion, and supporting the successful delivery of the company's
                products and initiatives. He also contributes to identifying new opportunities, strengthening industry
                relationships, and driving sustainable business growth.
              </p>
              <h4 className="text-sm font-semibold mb-2">Key Responsibilities:</h4>
              <ul className="text-sm text-foreground/80 space-y-2 list-disc pl-4 marker:text-secondary">
                <li>Manage day-to-day business operations.</li>
                <li>Coordinate cross-functional teams and project execution.</li>
                <li>Develop operational strategies that support company objectives.</li>
                <li>Build and maintain strategic partnerships.</li>
                <li>Support business development and market expansion initiatives.</li>
                <li>Improve organizational processes and operational efficiency.</li>
                <li>Collaborate with leadership on long-term planning and company growth.</li>
                <li>Represent Alpha ParadoxQC in business meetings, collaborations, and industry engagements.</li>
              </ul>
            </div>
            
          </div>
        </section>

        {/* Board of Directors & Authorized Signatories */}
        <section>
          <h3 className="text-xl font-bold mb-4">Board of Directors (July 2026)</h3>
          <div className="overflow-x-auto rounded-2xl border border-border/50 shadow-sm">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="text-xs text-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Appointment Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 bg-card">
                  <td className="px-6 py-4 font-medium text-foreground">Sourojit Mondal</td>
                  <td className="px-6 py-4">Director</td>
                  <td className="px-6 py-4">Current</td>
                  <td className="px-6 py-4">Jul 04, 2026</td>
                </tr>
                <tr className="bg-card">
                  <td className="px-6 py-4 font-medium text-foreground">Debanjan Paul</td>
                  <td className="px-6 py-4">Director</td>
                  <td className="px-6 py-4">Current</td>
                  <td className="px-6 py-4">Jul 04, 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Authorized Signatories</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50" /> Debanjan Paul</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50" /> Sourojit Mondal</li>
            </ul>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Contact Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <a href="mailto:quantum@alphaparadoxqc.com" className="group p-6 border border-border/50 rounded-2xl bg-card hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 flex items-center gap-5 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-inner">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">Primary Email</div>
                <div className="font-semibold text-foreground group-hover:text-accent transition-colors">quantum@alphaparadoxqc.com</div>
              </div>
            </a>
            <a href="mailto:alphaparadoxqc@gmail.com" className="group p-6 border border-border/50 rounded-2xl bg-card hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 flex items-center gap-5 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-inner">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">Secondary Email</div>
                <div className="font-semibold text-foreground group-hover:text-accent transition-colors">alphaparadoxqc@gmail.com</div>
              </div>
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
