'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { ScanResults } from '@/lib/types';

interface NodeProps {
  position: [number, number, number];
  label: string;
  color: string;
  isThreat?: boolean;
  isStatic?: boolean;
}

const Node = ({ position, label, color, isThreat, isStatic }: NodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const nodeContent = (
    <group position={position}>
      <Sphere ref={meshRef} args={[0.3, 32, 32]}>
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
        position={[0, 0.6, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
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

export const NetworkGraph = ({ data }: { data: ScanResults }) => {
  const nodes = useMemo(() => {
    if (!data) return [];

    const result = [];
    const center: [number, number, number] = [0, 0, 0];
    
    // Central Node
    result.push({ id: 'center', position: center, label: data.domain, color: '#22d3ee' });

    // DNS Nodes
    if (data.dns_data?.a?.length > 0) {
      result.push({ id: 'dns-a', position: [2, 1, 0] as [number, number, number], label: `IP: ${data.dns_data.a[0]}`, color: '#4ade80' });
    }
    if (data.dns_data?.mx?.length > 0) {
      result.push({ id: 'dns-mx', position: [2, -1, 0] as [number, number, number], label: `MX: ${data.dns_data.mx[0].exchange}`, color: '#4ade80' });
    }
    if (data.dns_data?.ns?.length > 0) {
      result.push({ id: 'dns-ns', position: [1.5, -2, 0] as [number, number, number], label: `NS: ${data.dns_data.ns[0]}`, color: '#4ade80' });
    }

    // Threat Nodes
    if (data.threat_intel?.overallVerdict === 'Malicious') {
      result.push({ id: 'threat', position: [-2, 1.5, 0] as [number, number, number], label: 'MALICIOUS', color: '#ef4444', isThreat: true });
    } else if (data.threat_intel?.overallVerdict === 'Suspicious') {
      result.push({ id: 'threat', position: [-2, 1.5, 0] as [number, number, number], label: 'SUSPICIOUS', color: '#f59e0b', isThreat: true });
    }

    // Risk Score Node
    result.push({
      id: 'score',
      position: [-1, 2.5, 0] as [number, number, number],
      label: `Risk: ${data.score}/100`,
      color: data.score > 70 ? '#ef4444' : data.score > 40 ? '#f59e0b' : '#4ade80',
      isThreat: data.score > 40,
      isStatic: true
    });

    // SSL Node
    result.push({ 
      id: 'ssl', 
      position: [0.5, 2, 0.5] as [number, number, number], 
      label: data.ssl_status?.valid ? 'SSL Valid' : 'SSL Invalid', 
      color: data.ssl_status?.valid ? '#4ade80' : '#ef4444',
      isStatic: true
    });

    // Geolocation Node
    if (data.geo_location) {
      result.push({ 
        id: 'geo', 
        position: [3, 0.5, 0.5] as [number, number, number], 
        label: `${data.geo_location.city}, ${data.geo_location.country}`, 
        color: '#d946ef' 
      });
    }

    // Abuse Node
    if (data.abuse_reputation && data.abuse_reputation.totalReports > 0) {
      result.push({
        id: 'abuse',
        position: [-2.5, -1, 0.5] as [number, number, number],
        label: `${data.abuse_reputation.totalReports} Reports`,
        color: data.abuse_reputation.abuseConfidenceScore > 50 ? '#ef4444' : '#f59e0b',
        isThreat: data.abuse_reputation.abuseConfidenceScore > 20
      });
    }

    // URLScan Tech Node
    if (data.url_scan?.technologies && data.url_scan.technologies.length > 0) {
      result.push({
        id: 'tech',
        position: [0.5, -2, 1] as [number, number, number],
        label: `${data.url_scan.technologies[0]} + others`,
        color: '#22d3ee'
      });
    }

    return result;
  }, [data]);

  return (
    <div className="w-full h-[500px] relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
        
        {nodes.map((node) => (
          <Node 
            key={node.id} 
            position={node.position} 
            label={node.label} 
            color={node.color} 
            isThreat={node.isThreat}
            isStatic={node.isStatic}
          />
        ))}

        {nodes.filter(n => n.id !== 'center').map((node) => (
          <Connection 
            key={`conn-${node.id}`} 
            start={[0, 0, 0]} 
            end={node.position} 
            color={node.color}
          />
        ))}

        <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={10} />
      </Canvas>
    </div>
  );
};
