import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import ForceGraph3D, { ForceGraphProps, ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';

export const Math3DGraph = forwardRef<ForceGraphMethods, ForceGraphProps & { theme: 'light' | 'dark', searchQuery?: string }>(({
  theme,
  nodeThreeObject,
  linkColor,
  searchQuery = '',
  ...props
}, ref) => {
  const fgRef = useRef<ForceGraphMethods>(null);
  const graphDataRef = useRef(props.graphData);

  // Update ref when props change
  useEffect(() => {
    graphDataRef.current = props.graphData;
  }, [props.graphData]);

  useEffect(() => {
    if (graphDataRef.current?.nodes) {
      const q = searchQuery.trim().toLowerCase();
      graphDataRef.current.nodes.forEach((node: any) => {
        if (node.__threeObj) {
          const group = node.__threeObj as THREE.Group;
          const searchHighlight = group.getObjectByName('searchHighlight');
          if (searchHighlight) {
            if (q && (node.name?.toLowerCase().includes(q) || node.category?.toLowerCase().includes(q))) {
              searchHighlight.visible = true;
            } else {
              searchHighlight.visible = false;
            }
          }
        }
      });
    }
  }, [searchQuery]);

  useImperativeHandle(ref, () => fgRef.current as ForceGraphMethods);

  useEffect(() => {
    // Animation Loop
    const animate = () => {
        if (graphDataRef.current?.nodes) {
            // Update halos
            graphDataRef.current.nodes.forEach((node: any) => {
                if (node.__threeObj) {
                    const group = node.__threeObj as THREE.Group;
                    const halo = group.getObjectByName('halo');
                    if (halo) {
                        halo.rotation.z += 0.01;
                    }
                }
            });
        }
        requestAnimationFrame(animate);
    };
    const reqId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqId);
  }, []);

  return (
    <ForceGraph3D
      {...props}
      ref={fgRef}
      backgroundColor={theme === 'dark' ? '#020617' : '#f8fafc'}
      linkColor={linkColor || (() => theme === 'dark' ? '#334155' : '#cbd5e1')}
      nodeThreeObjectExtend={true}
      nodeThreeObject={(node: any) => {
        const customObj = typeof nodeThreeObject === 'function' ? (nodeThreeObject as any)(node) : null;
        
        // Deep Node visualization: Core + Halo + Pulse
        const group = customObj || new THREE.Group();
        
        // Energy Halo (if not already added)
        if (!group.getObjectByName('halo')) {
            const haloGeo = new THREE.TorusGeometry(8, 0.5, 16, 32);
            const haloMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
            const halo = new THREE.Mesh(haloGeo, haloMat);
            halo.name = 'halo';
            group.add(halo);
        }

        return group;
      }}
    />
  );
});
