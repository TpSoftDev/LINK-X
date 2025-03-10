import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  title: string;
  description: string;
  image: string;
  color: string;
}

const products: Product[] = [
  {
    id: 1,
    title: "Data Analytics Platform",
    description: "Transform complex data into actionable insights with our intuitive analytics dashboard.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2100&q=80",
    color: "from-blue-500/20 to-indigo-500/20"
  },
  {
    id: 2,
    title: "Predictive Modeling",
    description: "Anticipate market trends and customer behavior with our advanced predictive algorithms.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80",
    color: "from-purple-500/20 to-pink-500/20"
  },
  {
    id: 3,
    title: "Real-time Monitoring",
    description: "Keep your finger on the pulse with real-time data monitoring and instant notifications.",
    image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
    color: "from-emerald-500/20 to-teal-500/20"
  }
];

const ProductShowcase = () => {
  const [activeProduct, setActiveProduct] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const productRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveProduct((prev) => (prev + 1) % products.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      productRefs.current.forEach((ref, index) => {
        if (ref) {
          if (index === activeProduct) {
            ref.classList.add("opacity-100", "translate-y-0");
            ref.classList.remove("opacity-0", "translate-y-8");
          } else {
            ref.classList.add("opacity-0", "translate-y-8");
            ref.classList.remove("opacity-100", "translate-y-0");
          }
        }
      });
    }
  }, [activeProduct, isVisible]);

  return (
    <section 
      id="products" 
      ref={sectionRef} 
      className="relative section-padding overflow-hidden bg-secondary/50"
    >
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Our Solutions
          </div>
          <h2 className="heading-lg mb-4">Innovative Products for Modern Businesses</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover our suite of powerful tools designed to elevate your business intelligence and drive strategic growth.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Product Tabs */}
          <div className="w-full lg:w-2/5">
            <div className="space-y-6">
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  className={cn(
                    "p-6 rounded-2xl cursor-pointer transition-all duration-500 ease-in-out transform border",
                    activeProduct === index 
                      ? "bg-white dark:bg-black shadow-xl scale-[1.03] border-transparent" 
                      : "hover:scale-[1.01] border-border"
                  )}
                  onClick={() => setActiveProduct(index)}
                >
                  <h3 className={cn(
                    "text-xl font-bold mb-2 transition-colors",
                    activeProduct === index ? "text-primary" : ""
                  )}>
                    {product.title}
                  </h3>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product Display */}
          <div className="w-full lg:w-3/5 relative h-[400px] md:h-[500px] overflow-hidden rounded-3xl">
            {products.map((product, index) => (
              <div 
                key={product.id}
                ref={el => productRefs.current[index] = el}
                className={cn(
                  "absolute inset-0 transition-all duration-700 ease-in-out transform",
                  activeProduct === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br",
                  product.color
                )} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">{product.title}</h3>
                  <p className="text-white/80 mb-4">{product.description}</p>
                  <button className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all btn-hover">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
