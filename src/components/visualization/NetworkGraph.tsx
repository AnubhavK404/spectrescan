'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Text, Line, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ScanResults } from '@/lib/types';

const Node = ({ position, label, color, isThreat, isStatic, size = 0.2 }: NodeProps & { size?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const nodeContent = (
    <group position={position}>
      <Sphere 
        ref={meshRef} 
        args={[size, 32, 32]}
      >
        <MeshDistortMaterial
          color={color}
          speed={isStatic ? 0 : (isThreat ? 4 : 2)}
          distort={isStatic ? 0 : (isThreat ? 0.4 : 0.2)}
          radius={1}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </Sphere>
      <Text
        position={[0, size + 0.3, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );

  if (isStatic) return nodeContent;

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      {nodeContent}
    </Float>
  );
};

interface ConnectionProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}

const Connection = ({ start, end, color }: ConnectionProps) => {
  const lineRef = useRef<any>(null);

  useFrame(() => {
    if (lineRef.current?.material) {
      if (lineRef.current.material.dashOffset !== undefined) {
        lineRef.current.material.dashOffset -= 0.01;
      }
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[start, end]}
      color={color}
      lineWidth={1}
      dashed
      dashScale={5}
      dashSize={0.5}
      gapSize={0.2}
    />
  );
};

const DataStream = ({ end, color }: { end: [number, number, number], color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    time.current += delta;
    const t = (time.current * 0.5) % 1;
    meshRef.current.position.set(end[0] * t, end[1] * t, end[2] * t);
  });

  return (
    <Sphere ref={meshRef} args={[0.05, 16, 16]}>
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </Sphere>
  );
};



const ShootingStars = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ShootingStar key={i} />
      ))}
    </>
  );
};

const ShootingStar = () => {
  const ref = useRef<THREE.Group>(null);
  const [config] = useState(() => ({
    start: new THREE.Vector3((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, -15),
    speed: Math.random() * 0.5 + 0.5,
    delay: Math.random() * -20
  }));
  
  const time = useRef(config.delay);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    time.current += delta * config.speed;
    
    if (time.current > 1) {
      time.current = -Math.random() * 20;
      config.start.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, -15);
    }
    
    if (time.current > 0) {
      const t = time.current;
      ref.current.position.set(
        config.start.x + t * 15,
        config.start.y - t * 15,
        config.start.z
      );
      ref.current.visible = true;
    } else {
      ref.current.visible = false;
    }
  });

  return (
    <group ref={ref} visible={false}>
      <Line 
        points={[[0, 0, 0], [-1, 1, 0]]} 
        color="#22d3ee" 
        lineWidth={0.5} 
        transparent 
        opacity={0.3} 
      />
      <Sphere args={[0.03, 8, 8]}>
        <meshBasicMaterial color="#22d3ee" />
      </Sphere>
    </group>
  );
};

export const NetworkGraph = ({ data }: { data: ScanResults }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    if (!data) return [];
    // ... (rest of the nodes logic remains same)
    const result = [];
    const center: [number, number, number] = [0, 0, 0];
    result.push({ id: 'center', position: center, label: data.domain, color: '#22d3ee' });
    // DNS Nodes (Green) - Shortened
    if (data.dns_data?.a?.length > 0) result.push({ id: 'dns-a', position: [2, 0.8, 0] as [number, number, number], label: `IP: ${data.dns_data.a[0]}`, color: '#4ade80' });
    if (data.dns_data?.mx?.length > 0) result.push({ id: 'dns-mx', position: [2, -0.8, 0] as [number, number, number], label: `MX: ${data.dns_data.mx[0].exchange}`, color: '#4ade80' });
    if (data.dns_data?.ns?.length > 0) result.push({ id: 'dns-ns', position: [1.8, -1.5, 0] as [number, number, number], label: `NS: ${data.dns_data.ns[0]}`, color: '#4ade80' });

    // Infrastructure (Magenta) - Shortened
    if (data.url_scan?.pageDetails?.asn) {
      result.push({ id: 'asn', position: [2.5, 0, 1] as [number, number, number], label: `ASN: ${data.url_scan.pageDetails.asn}`, color: '#d946ef' });
    }
    if (data.geo_location?.isp) {
      result.push({ id: 'isp', position: [2.2, 1.5, -1] as [number, number, number], label: `ISP: ${data.geo_location.isp}`, color: '#d946ef' });
    }

    // Whois (Cyan) - Shortened
    if (typeof data.whois_data !== 'string') {
      if (data.whois_data.registrar) {
        result.push({ id: 'registrar', position: [0, -2.5, 0] as [number, number, number], label: `Reg: ${data.whois_data.registrar}`, color: '#22d3ee' });
      }
      if (data.whois_data.creationDate) {
        result.push({ id: 'created', position: [1.2, -2.5, 0.5] as [number, number, number], label: `Born: ${new Date(data.whois_data.creationDate).getFullYear()}`, color: '#22d3ee' });
      }
    }

    // Threat Intel (Red/Yellow) - Shortened
    if (data.threat_intel?.overallVerdict === 'Malicious') {
      result.push({ id: 'threat', position: [-2, 1, 0] as [number, number, number], label: 'MALICIOUS', color: '#ef4444', isThreat: true });
    } else if (data.threat_intel?.overallVerdict === 'Suspicious') {
      result.push({ id: 'threat', position: [-2, 1, 0] as [number, number, number], label: 'SUSPICIOUS', color: '#f59e0b', isThreat: true });
    }
    if (data.threat_intel?.virusTotal) {
      result.push({ id: 'vt', position: [-2.5, 2.2, 1] as [number, number, number], label: `VT: ${data.threat_intel.virusTotal.malicious} hits`, color: '#ef4444', isThreat: true });
    }

    // Risk Score (Dynamic) - Shortened
    result.push({ id: 'score', position: [-1, 2.5, 0] as [number, number, number], label: `Score: ${data.score}/100`, color: data.score > 70 ? '#ef4444' : data.score > 40 ? '#f59e0b' : '#4ade80', isThreat: data.score > 40, isStatic: true });

    // SSL Node (Green/Red) - Shortened
    result.push({ id: 'ssl', position: [0.8, 2.2, 0.5] as [number, number, number], label: data.ssl_status?.valid ? 'SSL Valid' : 'SSL Invalid', color: data.ssl_status?.valid ? '#4ade80' : '#ef4444', isStatic: true });

    // Page Meta (Cyan) - Shortened
    if (data.url_scan?.pageDetails?.title) {
      result.push({ id: 'title', position: [-0.8, -2.2, 1.5] as [number, number, number], label: data.url_scan.pageDetails.title.substring(0, 15) + '...', color: '#22d3ee' });
    }
    if (data.url_scan?.stats) {
      result.push({ id: 'stats', position: [-1.5, -1.8, -1] as [number, number, number], label: `${data.url_scan.stats.requests} Requests`, color: '#22d3ee' });
    }

    // Geolocation Node (Magenta) - Shortened
    if (data.geo_location) {
      result.push({ id: 'geo', position: [2.5, 2, 0.5] as [number, number, number], label: `${data.geo_location.city}, ${data.geo_location.country}`, color: '#d946ef' });
    }

    // Abuse Node (Red/Yellow) - Shortened
    if (data.abuse_reputation && data.abuse_reputation.totalReports > 0) {
      result.push({
        id: 'abuse',
        position: [-2.8, -0.8, 0.5] as [number, number, number],
        label: `${data.abuse_reputation.totalReports} Abuse Reports`,
        color: data.abuse_reputation.abuseConfidenceScore > 50 ? '#ef4444' : '#f59e0b',
        isThreat: data.abuse_reputation.abuseConfidenceScore > 20
      });
    }

    // URLScan Tech Node (Cyan) - Shortened
    if (data.url_scan?.technologies && data.url_scan.technologies.length > 0) {
      result.push({
        id: 'tech',
        position: [1.2, -1.5, 1.2] as [number, number, number],
        label: `${data.url_scan.technologies[0]} Stack`,
        color: '#22d3ee'
      });
    }
    return result;
  }, [data]);

  return (
    <div className="w-full h-[350px] md:h-[500px] relative pointer-events-none">
      <Canvas camera={{ position: [0, 0, 9], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={100} scale={10} size={1} speed={0.4} color="#22d3ee" />
        <ShootingStars />
        
        <RotatingGroup nodes={nodes} />
      </Canvas>
    </div>
  );
};

const RotatingGroup = ({ nodes }: { nodes: any[] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={groupRef}>
      {nodes.map((node) => (
        <Node 
          key={node.id} 
          position={node.position} 
          label={node.label} 
          color={node.color} 
          isThreat={node.isThreat}
          isStatic={node.isStatic}
          size={node.id === 'center' ? 0.5 : 0.2}
        />
      ))}

      {nodes.filter(n => n.id !== 'center').map((node) => (
        <group key={`group-${node.id}`}>
          <Connection 
            start={[0, 0, 0]} 
            end={node.position} 
            color={node.color}
          />
          <DataStream 
            end={node.position} 
            color={node.color}
          />
        </group>
      ))}
    </group>
  );
};
