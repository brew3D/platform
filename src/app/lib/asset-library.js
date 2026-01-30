// Brew 3D Asset Library - Comprehensive 3D Asset Collection
// Organized into 8 themed packs for easy browsing and management

export const ASSET_PACKS = {
  'basic-shapes': {
    id: 'basic-shapes',
    name: 'Basic Shapes',
    description: 'Core building blocks for any 3D scene. Parameterized primitives with customizable dimensions.',
    icon: '🟦',
    color: '#8b5a2b',
    assets: [
      { 
        id: 'cube', 
        name: 'Cube', 
        type: 'cube', 
        description: 'Box with customizable width, height, and depth',
        assetType: 'cube',
        parts: [
          { shape: 'cube', width: 1, height: 1, depth: 1, position: [0, 0.5, 0] }
        ]
      },
      { 
        id: 'sphere', 
        name: 'Sphere', 
        type: 'sphere', 
        description: 'Perfect sphere with adjustable radius',
        assetType: 'sphere',
        parts: [
          { shape: 'sphere', radius: 0.5, position: [0, 0.5, 0] }
        ]
      },
      { 
        id: 'cylinder', 
        name: 'Cylinder', 
        type: 'cylinder', 
        description: 'Cylindrical shape with radius and height',
        assetType: 'cylinder',
        parts: [
          { shape: 'cylinder', radius: 0.5, height: 1, position: [0, 0.5, 0] }
        ]
      },
      { 
        id: 'cone', 
        name: 'Cone', 
        type: 'cone', 
        description: 'Cone with base radius and height',
        assetType: 'cone',
        parts: [
          { shape: 'cone', radius: 0.5, height: 1, position: [0, 0.5, 0] }
        ]
      },
      { 
        id: 'torus', 
        name: 'Torus', 
        type: 'torus', 
        description: 'Donut shape with inner and outer radius',
        assetType: 'torus',
        parts: [
          { shape: 'torus', radius: 0.5, tube: 0.2, position: [0, 0.5, 0] }
        ]
      },
      { 
        id: 'capsule', 
        name: 'Capsule', 
        type: 'capsule', 
        description: 'Rounded cylinder with hemispherical ends',
        assetType: 'capsule',
        parts: [
          { shape: 'capsule', radius: 0.3, height: 1, position: [0, 0.5, 0] }
        ]
      },
      { 
        id: 'plane', 
        name: 'Plane', 
        type: 'plane', 
        description: 'Flat surface for floors, walls, and platforms',
        assetType: 'plane',
        parts: [
          { shape: 'plane', width: 2, height: 2, position: [0, 0, 0] }
        ]
      },
      { 
        id: 'pyramid', 
        name: 'Pyramid', 
        type: 'pyramid', 
        description: 'Four-sided pyramid with square base',
        assetType: 'pyramid',
        parts: [
          { shape: 'pyramid', width: 1, height: 1, depth: 1, position: [0, 0.5, 0] }
        ]
      },
      { 
        id: 'prism-triangular', 
        name: 'Triangular Prism', 
        type: 'prism-triangular', 
        description: 'Three-sided prism',
        assetType: 'prism-triangular',
        parts: [
          { shape: 'prism-triangular', width: 1, height: 1, depth: 1, position: [0, 0.5, 0] }
        ]
      },
      { 
        id: 'prism-hexagonal', 
        name: 'Hexagonal Prism', 
        type: 'prism-hexagonal', 
        description: 'Six-sided prism',
        assetType: 'prism-hexagonal',
        parts: [
          { shape: 'prism-hexagonal', width: 1, height: 1, depth: 1, position: [0, 0.5, 0] }
        ]
      }
    ]
  },
  'nature-pack': {
    id: 'nature-pack',
    name: 'Nature Pack',
    description: 'Natural assets for outdoor environments. Low-poly stylized models perfect for any scene.',
    icon: '🌿',
    color: '#4ade80',
    assets: [
      { 
        id: 'tree', 
        name: 'Tree', 
        type: 'tree', 
        description: 'Low-poly stylized tree with trunk and leaves',
        assetType: 'tree',
        parts: [
          { shape: 'cylinder', radius: 0.2, height: 2, position: [0, 1, 0] }, // Trunk
          { shape: 'sphere', radius: 1.2, position: [0, 2.5, 0] }, // Leaves
          { shape: 'sphere', radius: 0.8, position: [-0.8, 2.2, 0] }, // Left branch
          { shape: 'sphere', radius: 0.8, position: [0.8, 2.2, 0] } // Right branch
        ]
      },
      { 
        id: 'bush', 
        name: 'Bush', 
        type: 'bush', 
        description: 'Small shrub for landscaping',
        assetType: 'bush',
        parts: [
          { shape: 'sphere', radius: 0.6, position: [0, 0.6, 0] }, // Main bush
          { shape: 'sphere', radius: 0.4, position: [-0.3, 0.4, 0] }, // Left cluster
          { shape: 'sphere', radius: 0.4, position: [0.3, 0.4, 0] } // Right cluster
        ]
      },
      { 
        id: 'grass-patch-1', 
        name: 'Grass Patch Type 1', 
        type: 'grass-patch-1', 
        description: 'Natural grass cluster',
        assetType: 'grass-patch-1',
        parts: [
          { shape: 'cube', width: 0.05, height: 0.3, depth: 0.05, position: [-0.2, 0.15, -0.2] }, // Grass 1
          { shape: 'cube', width: 0.05, height: 0.4, depth: 0.05, position: [0, 0.2, -0.1] }, // Grass 2
          { shape: 'cube', width: 0.05, height: 0.25, depth: 0.05, position: [0.2, 0.125, 0.1] }, // Grass 3
          { shape: 'cube', width: 0.05, height: 0.35, depth: 0.05, position: [-0.1, 0.175, 0.2] }, // Grass 4
          { shape: 'cube', width: 0.05, height: 0.2, depth: 0.05, position: [0.1, 0.1, 0.2] } // Grass 5
        ]
      },
      { 
        id: 'grass-patch-2', 
        name: 'Grass Patch Type 2', 
        type: 'grass-patch-2', 
        description: 'Alternative grass style',
        assetType: 'grass-patch-2',
        parts: [
          { shape: 'cube', width: 0.03, height: 0.4, depth: 0.03, position: [-0.15, 0.2, -0.15] }, // Grass 1
          { shape: 'cube', width: 0.03, height: 0.5, depth: 0.03, position: [0.15, 0.25, -0.15] }, // Grass 2
          { shape: 'cube', width: 0.03, height: 0.3, depth: 0.03, position: [-0.15, 0.15, 0.15] }, // Grass 3
          { shape: 'cube', width: 0.03, height: 0.45, depth: 0.03, position: [0.15, 0.225, 0.15] }, // Grass 4
          { shape: 'cube', width: 0.03, height: 0.35, depth: 0.03, position: [0, 0.175, 0] } // Grass 5
        ]
      },
      { 
        id: 'rock', 
        name: 'Rock', 
        type: 'rock', 
        description: 'Irregular rock formation',
        assetType: 'rock',
        parts: [
          { shape: 'sphere', radius: 0.4, position: [0, 0.4, 0] }, // Main rock
          { shape: 'sphere', radius: 0.2, position: [-0.3, 0.2, 0.2] }, // Small rock 1
          { shape: 'sphere', radius: 0.15, position: [0.2, 0.15, -0.2] }, // Small rock 2
          { shape: 'sphere', radius: 0.1, position: [0.1, 0.1, 0.3] } // Tiny rock
        ]
      },
      { 
        id: 'water-plane', 
        name: 'Water Plane', 
        type: 'water-plane', 
        description: 'Flat water surface for ponds',
        assetType: 'water-plane',
        parts: [
          { shape: 'plane', width: 4, height: 4, position: [0, 0, 0] } // Water surface
        ]
      },
      { 
        id: 'cloud', 
        name: 'Cloud', 
        type: 'cloud', 
        description: 'Puffy cloud cluster',
        assetType: 'cloud',
        parts: [
          { shape: 'sphere', radius: 0.8, position: [0, 0.8, 0] }, // Main cloud
          { shape: 'sphere', radius: 0.6, position: [-0.6, 0.6, 0] }, // Left puff
          { shape: 'sphere', radius: 0.6, position: [0.6, 0.6, 0] }, // Right puff
          { shape: 'sphere', radius: 0.4, position: [0, 0.4, 0.5] }, // Front puff
          { shape: 'sphere', radius: 0.4, position: [0, 0.4, -0.5] } // Back puff
        ]
      },
      { 
        id: 'mountain', 
        name: 'Mountain', 
        type: 'mountain', 
        description: 'Hill with noise-based terrain',
        assetType: 'mountain',
        parts: [
          { shape: 'pyramid', width: 3, height: 2, depth: 3, position: [0, 1, 0] }, // Main peak
          { shape: 'pyramid', width: 1.5, height: 1, depth: 1.5, position: [-1, 0.5, -1] }, // Side peak 1
          { shape: 'pyramid', width: 1.5, height: 1, depth: 1.5, position: [1, 0.5, 1] }, // Side peak 2
          { shape: 'pyramid', width: 1, height: 0.5, depth: 1, position: [0, 0.25, -1.5] } // Small hill
        ]
      }
    ]
  },
  'furniture-props': {
    id: 'furniture-props',
    name: 'Furniture & Props',
    description: 'Interior basics for house scenes, RPG interiors, and indoor environments.',
    icon: '🪑',
    color: '#f59e0b',
    assets: [
      { 
        id: 'chair', 
        name: 'Chair', 
        type: 'chair', 
        description: 'Standard four-legged chair',
        assetType: 'chair',
        parts: [
          { shape: 'cube', width: 0.8, height: 0.05, depth: 0.8, position: [0, 0.4, 0] }, // Seat
          { shape: 'cube', width: 0.8, height: 0.8, depth: 0.05, position: [0, 0.8, -0.375] }, // Back
          { shape: 'cube', width: 0.05, height: 0.4, depth: 0.05, position: [-0.35, 0.2, -0.35] }, // Leg 1
          { shape: 'cube', width: 0.05, height: 0.4, depth: 0.05, position: [0.35, 0.2, -0.35] }, // Leg 2
          { shape: 'cube', width: 0.05, height: 0.4, depth: 0.05, position: [-0.35, 0.2, 0.35] }, // Leg 3
          { shape: 'cube', width: 0.05, height: 0.4, depth: 0.05, position: [0.35, 0.2, 0.35] } // Leg 4
        ]
      },
      { 
        id: 'table-square', 
        name: 'Square Table', 
        type: 'table-square', 
        description: 'Rectangular dining table',
        assetType: 'table',
        parts: [
          { shape: 'cube', width: 2, height: 0.1, depth: 1, position: [0, 1, 0] },
          { shape: 'cube', width: 0.1, height: 1, depth: 0.1, position: [-0.9, 0.5, -0.4] },
          { shape: 'cube', width: 0.1, height: 1, depth: 0.1, position: [0.9, 0.5, -0.4] },
          { shape: 'cube', width: 0.1, height: 1, depth: 0.1, position: [-0.9, 0.5, 0.4] },
          { shape: 'cube', width: 0.1, height: 1, depth: 0.1, position: [0.9, 0.5, 0.4] }
        ]
      },
      { 
        id: 'table-round', 
        name: 'Round Table', 
        type: 'table-round', 
        description: 'Circular table',
        assetType: 'table-round',
        parts: [
          { shape: 'cylinder', radius: 1, height: 0.1, position: [0, 1, 0] }, // Tabletop
          { shape: 'cylinder', radius: 0.1, height: 1, position: [0, 0.5, 0] } // Center leg
        ]
      },
      { 
        id: 'bed', 
        name: 'Bed', 
        type: 'bed', 
        description: 'Single bed with headboard',
        assetType: 'bed',
        parts: [
          { shape: 'cube', width: 2, height: 0.3, depth: 1, position: [0, 0.15, 0] }, // Mattress
          { shape: 'cube', width: 2, height: 0.8, depth: 0.1, position: [0, 0.7, -0.45] }, // Headboard
          { shape: 'cube', width: 0.1, height: 0.3, depth: 0.1, position: [-0.9, 0.15, -0.4] }, // Leg 1
          { shape: 'cube', width: 0.1, height: 0.3, depth: 0.1, position: [0.9, 0.15, -0.4] }, // Leg 2
          { shape: 'cube', width: 0.1, height: 0.3, depth: 0.1, position: [-0.9, 0.15, 0.4] }, // Leg 3
          { shape: 'cube', width: 0.1, height: 0.3, depth: 0.1, position: [0.9, 0.15, 0.4] } // Leg 4
        ]
      },
      { 
        id: 'sofa', 
        name: 'Sofa', 
        type: 'sofa', 
        description: 'Three-seat couch',
        assetType: 'sofa',
        parts: [
          { shape: 'cube', width: 3, height: 0.4, depth: 1, position: [0, 0.2, 0] }, // Seat
          { shape: 'cube', width: 3, height: 0.8, depth: 0.2, position: [0, 0.6, -0.4] }, // Back
          { shape: 'cube', width: 0.2, height: 0.4, depth: 1, position: [-1.4, 0.2, 0] }, // Left arm
          { shape: 'cube', width: 0.2, height: 0.4, depth: 1, position: [1.4, 0.2, 0] }, // Right arm
          { shape: 'cube', width: 0.1, height: 0.4, depth: 0.1, position: [-1.4, 0.2, -0.4] }, // Leg 1
          { shape: 'cube', width: 0.1, height: 0.4, depth: 0.1, position: [1.4, 0.2, -0.4] }, // Leg 2
          { shape: 'cube', width: 0.1, height: 0.4, depth: 0.1, position: [-1.4, 0.2, 0.4] }, // Leg 3
          { shape: 'cube', width: 0.1, height: 0.4, depth: 0.1, position: [1.4, 0.2, 0.4] } // Leg 4
        ]
      },
      { 
        id: 'bookshelf', 
        name: 'Bookshelf', 
        type: 'bookshelf', 
        description: 'Tall bookcase with shelves',
        assetType: 'bookshelf',
        parts: [
          { shape: 'cube', width: 1, height: 0.05, depth: 0.3, position: [0, 0.5, 0] }, // Top shelf
          { shape: 'cube', width: 1, height: 0.05, depth: 0.3, position: [0, 0.3, 0] }, // Middle shelf
          { shape: 'cube', width: 1, height: 0.05, depth: 0.3, position: [0, 0.1, 0] }, // Bottom shelf
          { shape: 'cube', width: 0.05, height: 1, depth: 0.3, position: [-0.475, 0.5, 0] }, // Left side
          { shape: 'cube', width: 0.05, height: 1, depth: 0.3, position: [0.475, 0.5, 0] }, // Right side
          { shape: 'cube', width: 1, height: 0.05, depth: 0.3, position: [0, 0.9, 0] }, // Top
          { shape: 'cube', width: 1, height: 0.05, depth: 0.3, position: [0, -0.1, 0] } // Bottom
        ]
      },
      { 
        id: 'cabinet', 
        name: 'Cabinet', 
        type: 'cabinet', 
        description: 'Storage cabinet with drawers',
        assetType: 'cabinet',
        parts: [
          { shape: 'cube', width: 1.5, height: 1.8, depth: 0.6, position: [0, 0.9, 0] }, // Main body
          { shape: 'cube', width: 1.4, height: 0.05, depth: 0.5, position: [0, 1.2, 0.25] }, // Top drawer
          { shape: 'cube', width: 1.4, height: 0.05, depth: 0.5, position: [0, 0.9, 0.25] }, // Middle drawer
          { shape: 'cube', width: 1.4, height: 0.05, depth: 0.5, position: [0, 0.6, 0.25] }, // Bottom drawer
          { shape: 'cube', width: 0.05, height: 0.05, depth: 0.05, position: [-0.6, 1.2, 0.25] }, // Handle 1
          { shape: 'cube', width: 0.05, height: 0.05, depth: 0.05, position: [-0.6, 0.9, 0.25] }, // Handle 2
          { shape: 'cube', width: 0.05, height: 0.05, depth: 0.05, position: [-0.6, 0.6, 0.25] } // Handle 3
        ]
      },
      { 
        id: 'lamp', 
        name: 'Lamp', 
        type: 'lamp', 
        description: 'Table lamp with base and shade',
        assetType: 'lamp',
        parts: [
          { shape: 'cylinder', radius: 0.1, height: 0.8, position: [0, 0.4, 0] }, // Base
          { shape: 'cylinder', radius: 0.4, height: 0.3, position: [0, 0.9, 0] }, // Shade
          { shape: 'sphere', radius: 0.05, position: [0, 0.8, 0] } // Light bulb
        ]
      },
      { 
        id: 'rug', 
        name: 'Rug', 
        type: 'rug', 
        description: 'Decorative carpet plane',
        assetType: 'rug',
        parts: [
          { shape: 'plane', width: 3, height: 2, position: [0, 0.01, 0] } // Rug surface
        ]
      }
    ]
  },
  'building-blocks': {
    id: 'building-blocks',
    name: 'Building Blocks',
    description: 'Architecture components for constructing buildings, houses, and structures.',
    icon: '🏗️',
    color: '#ef4444',
    assets: [
      { 
        id: 'wall', 
        name: 'Wall', 
        type: 'wall', 
        description: 'Basic wall segment',
        assetType: 'wall',
        parts: [
          { shape: 'cube', width: 0.2, height: 2, depth: 4, position: [0, 1, 0] } // Wall segment
        ]
      },
      { 
        id: 'wall-window', 
        name: 'Wall with Window', 
        type: 'wall-window', 
        description: 'Wall with window cutout',
        assetType: 'wall-window',
        parts: [
          { shape: 'cube', width: 0.2, height: 1, depth: 4, position: [0, 0.5, 0] }, // Bottom wall
          { shape: 'cube', width: 0.2, height: 0.5, depth: 4, position: [0, 1.75, 0] }, // Top wall
          { shape: 'cube', width: 0.2, height: 0.5, depth: 1, position: [0, 1.25, -1.5] }, // Left side
          { shape: 'cube', width: 0.2, height: 0.5, depth: 1, position: [0, 1.25, 1.5] }, // Right side
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.1, position: [0.05, 1.25, 0] } // Window frame
        ]
      },
      { 
        id: 'door', 
        name: 'Door', 
        type: 'door', 
        description: 'Rectangular door with hinge pivot',
        assetType: 'door',
        parts: [
          { shape: 'cube', width: 0.05, height: 2, depth: 1, position: [0, 1, 0] }, // Door panel
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.1, position: [-0.4, 1, 0] }, // Hinge
          { shape: 'cube', width: 0.05, height: 0.05, depth: 0.05, position: [0.4, 1, 0] } // Handle
        ]
      },
      { 
        id: 'window-frame', 
        name: 'Window Frame', 
        type: 'window-frame', 
        description: 'Standalone window frame',
        assetType: 'window-frame',
        parts: [
          { shape: 'cube', width: 0.1, height: 1.5, depth: 0.1, position: [-0.5, 0.75, 0] }, // Left frame
          { shape: 'cube', width: 0.1, height: 1.5, depth: 0.1, position: [0.5, 0.75, 0] }, // Right frame
          { shape: 'cube', width: 1, height: 0.1, depth: 0.1, position: [0, 0.25, 0] }, // Bottom frame
          { shape: 'cube', width: 1, height: 0.1, depth: 0.1, position: [0, 1.25, 0] }, // Top frame
          { shape: 'cube', width: 0.05, height: 1.3, depth: 0.05, position: [0, 0.75, 0] } // Center divider
        ]
      },
      { 
        id: 'stairs-straight', 
        name: 'Straight Stairs', 
        type: 'stairs-straight', 
        description: 'Linear staircase',
        assetType: 'stairs-straight',
        parts: [
          { shape: 'cube', width: 1, height: 0.1, depth: 0.3, position: [0, 0.05, 0] }, // Step 1
          { shape: 'cube', width: 1, height: 0.1, depth: 0.3, position: [0, 0.15, 0.3] }, // Step 2
          { shape: 'cube', width: 1, height: 0.1, depth: 0.3, position: [0, 0.25, 0.6] }, // Step 3
          { shape: 'cube', width: 1, height: 0.1, depth: 0.3, position: [0, 0.35, 0.9] }, // Step 4
          { shape: 'cube', width: 1, height: 0.1, depth: 0.3, position: [0, 0.45, 1.2] }, // Step 5
          { shape: 'cube', width: 1, height: 0.1, depth: 0.3, position: [0, 0.55, 1.5] } // Step 6
        ]
      },
      { 
        id: 'stairs-spiral', 
        name: 'Spiral Stairs', 
        type: 'stairs-spiral', 
        description: 'Curved spiral staircase',
        assetType: 'stairs-spiral',
        parts: [
          { shape: 'cylinder', radius: 0.1, height: 2, position: [0, 1, 0] }, // Center pole
          { shape: 'cube', width: 0.8, height: 0.1, depth: 0.2, position: [0.4, 0.1, 0] }, // Step 1
          { shape: 'cube', width: 0.8, height: 0.1, depth: 0.2, position: [0.28, 0.3, 0.28] }, // Step 2
          { shape: 'cube', width: 0.8, height: 0.1, depth: 0.2, position: [0, 0.5, 0.4] }, // Step 3
          { shape: 'cube', width: 0.8, height: 0.1, depth: 0.2, position: [-0.28, 0.7, 0.28] }, // Step 4
          { shape: 'cube', width: 0.8, height: 0.1, depth: 0.2, position: [-0.4, 0.9, 0] }, // Step 5
          { shape: 'cube', width: 0.8, height: 0.1, depth: 0.2, position: [-0.28, 1.1, -0.28] }, // Step 6
          { shape: 'cube', width: 0.8, height: 0.1, depth: 0.2, position: [0, 1.3, -0.4] }, // Step 7
          { shape: 'cube', width: 0.8, height: 0.1, depth: 0.2, position: [0.28, 1.5, -0.28] }, // Step 8
          { shape: 'cube', width: 0.8, height: 0.1, depth: 0.2, position: [0.4, 1.7, 0] } // Step 9
        ]
      },
      { 
        id: 'fence', 
        name: 'Fence Segment', 
        type: 'fence', 
        description: 'Basic fence panel',
        assetType: 'fence',
        parts: [
          { shape: 'cube', width: 0.05, height: 1, depth: 0.05, position: [-0.5, 0.5, 0] }, // Left post
          { shape: 'cube', width: 0.05, height: 1, depth: 0.05, position: [0.5, 0.5, 0] }, // Right post
          { shape: 'cube', width: 1, height: 0.05, depth: 0.05, position: [0, 0.8, 0] }, // Top rail
          { shape: 'cube', width: 1, height: 0.05, depth: 0.05, position: [0, 0.2, 0] }, // Bottom rail
          { shape: 'cube', width: 0.05, height: 0.6, depth: 0.05, position: [-0.25, 0.5, 0] }, // Center post
          { shape: 'cube', width: 0.05, height: 0.6, depth: 0.05, position: [0.25, 0.5, 0] } // Center post
        ]
      },
      { 
        id: 'roof', 
        name: 'Roof', 
        type: 'roof', 
        description: 'Triangular roof section',
        assetType: 'roof',
        parts: [
          { shape: 'cube', width: 4, height: 0.1, depth: 2, position: [0, 0.05, 0] }, // Base
          { shape: 'cube', width: 4, height: 1.5, depth: 0.1, position: [0, 0.8, -0.95] }, // Left slope
          { shape: 'cube', width: 4, height: 1.5, depth: 0.1, position: [0, 0.8, 0.95] }, // Right slope
          { shape: 'cube', width: 0.1, height: 1.5, depth: 2, position: [-1.95, 0.8, 0] }, // Front slope
          { shape: 'cube', width: 0.1, height: 1.5, depth: 2, position: [1.95, 0.8, 0] } // Back slope
        ]
      },
      { 
        id: 'column', 
        name: 'Column', 
        type: 'column', 
        description: 'Decorative pillar',
        assetType: 'column',
        parts: [
          { shape: 'cylinder', radius: 0.3, height: 2, position: [0, 1, 0] }, // Main column
          { shape: 'cylinder', radius: 0.4, height: 0.2, position: [0, 2.1, 0] }, // Capital
          { shape: 'cylinder', radius: 0.35, height: 0.1, position: [0, 0.05, 0] } // Base
        ]
      },
      { 
        id: 'archway', 
        name: 'Archway', 
        type: 'archway', 
        description: 'Curved architectural arch',
        assetType: 'archway',
        parts: [
          { shape: 'cube', width: 0.3, height: 1.5, depth: 0.3, position: [-0.5, 0.75, 0] }, // Left pillar
          { shape: 'cube', width: 0.3, height: 1.5, depth: 0.3, position: [0.5, 0.75, 0] }, // Right pillar
          { shape: 'cube', width: 1.3, height: 0.3, depth: 0.3, position: [0, 1.65, 0] }, // Top beam
          { shape: 'cylinder', radius: 0.5, height: 0.3, position: [0, 1.5, 0] } // Arch
        ]
      }
    ]
  },
  'vehicles': {
    id: 'vehicles',
    name: 'Vehicles & Movement',
    description: 'Low-poly vehicles and movement objects. Symbolic designs perfect for MVP testing.',
    icon: '🚗',
    color: '#06b6d4',
    assets: [
      { 
        id: 'car-body', 
        name: 'Car Body', 
        type: 'car-body', 
        description: 'Detailed car with body, roof, windows, wheels, and lights',
        assetType: 'car',
        parts: [
          {
            name: 'car_body',
            shape: 'cuboid',
            width: 4,
            height: 1.2,
            depth: 2,
            position: [0, 0.6, 0],
            color: '#ff0000'
          },
          {
            name: 'car_roof',
            shape: 'cuboid',
            width: 2.5,
            height: 0.8,
            depth: 2,
            position: [0, 1.6, 0],
            color: '#ff0000'
          },
          {
            name: 'front_window',
            shape: 'cuboid',
            width: 2.3,
            height: 0.7,
            depth: 0.05,
            position: [0, 1.6, 1.025],
            color: '#87ceeb',
            transparency: 0.5
          },
          {
            name: 'rear_window',
            shape: 'cuboid',
            width: 2.3,
            height: 0.7,
            depth: 0.05,
            position: [0, 1.6, -1.025],
            color: '#87ceeb',
            transparency: 0.5
          },
          {
            name: 'left_window',
            shape: 'cuboid',
            width: 0.05,
            height: 0.7,
            depth: 1.9,
            position: [-1.25, 1.6, 0],
            color: '#87ceeb',
            transparency: 0.5
          },
          {
            name: 'right_window',
            shape: 'cuboid',
            width: 0.05,
            height: 0.7,
            depth: 1.9,
            position: [1.25, 1.6, 0],
            color: '#87ceeb',
            transparency: 0.5
          },
          {
            name: 'front_left_wheel',
            shape: 'cylinder',
            radius: 0.5,
            height: 0.3,
            position: [-1.5, 0.25, 1.2],
            rotation: [90, 0, 0],
            color: '#222222'
          },
          {
            name: 'front_right_wheel',
            shape: 'cylinder',
            radius: 0.5,
            height: 0.3,
            position: [1.5, 0.25, 1.2],
            rotation: [90, 0, 0],
            color: '#222222'
          },
          {
            name: 'rear_left_wheel',
            shape: 'cylinder',
            radius: 0.5,
            height: 0.3,
            position: [-1.5, 0.25, -1.2],
            rotation: [90, 0, 0],
            color: '#222222'
          },
          {
            name: 'rear_right_wheel',
            shape: 'cylinder',
            radius: 0.5,
            height: 0.3,
            position: [1.5, 0.25, -1.2],
            rotation: [90, 0, 0],
            color: '#222222'
          },
          {
            name: 'front_left_headlight',
            shape: 'sphere',
            radius: 0.2,
            position: [-0.8, 0.6, 1.05],
            color: '#ffff00',
            emissive: true
          },
          {
            name: 'front_right_headlight',
            shape: 'sphere',
            radius: 0.2,
            position: [0.8, 0.6, 1.05],
            color: '#ffff00',
            emissive: true
          },
          {
            name: 'rear_left_taillight',
            shape: 'sphere',
            radius: 0.2,
            position: [-0.8, 0.6, -1.05],
            color: '#ff0000',
            emissive: true
          },
          {
            name: 'rear_right_taillight',
            shape: 'sphere',
            radius: 0.2,
            position: [0.8, 0.6, -1.05],
            color: '#ff0000',
            emissive: true
          }
        ]
      },
      { 
        id: 'wheel', 
        name: 'Wheel', 
        type: 'wheel', 
        description: 'Standard vehicle wheel',
        assetType: 'wheel',
        parts: [
          { shape: 'cylinder', radius: 0.4, height: 0.2, position: [0, 0.1, 0] }, // Tire
          { shape: 'cylinder', radius: 0.3, height: 0.25, position: [0, 0.125, 0] }, // Rim
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.3, position: [0, 0.125, 0] }, // Spoke 1
          { shape: 'cube', width: 0.3, height: 0.1, depth: 0.1, position: [0, 0.125, 0] } // Spoke 2
        ]
      },
      { 
        id: 'boat-hull', 
        name: 'Speed Motor Boat', 
        type: 'boat-hull', 
        description: 'A sleek motor boat designed for speed and agility on water. Features aerodynamic hull, outboard engine, and luxury seating.',
        assetType: 'boat-hull',
        parts: [
          {
            name: 'hull',
            shape: 'cuboid',
            width: 12,
            height: 1.5,
            depth: 3,
            position: [0, 0.75, 0],
            color: '#ffffff'
          },
          {
            name: 'deck',
            shape: 'cuboid',
            width: 11.5,
            height: 0.05,
            depth: 2.8,
            position: [0, 1.525, 0],
            color: '#b5651d'
          },
          {
            name: 'windshield',
            shape: 'cuboid',
            width: 2.5,
            height: 0.7,
            depth: 0.05,
            position: [0, 1.35, 3],
            color: '#a0d8ef',
            transparency: 0.5
          },
          {
            name: 'seat_left',
            shape: 'cuboid',
            width: 0.8,
            height: 0.6,
            depth: 0.8,
            position: [-0.9, 1.1, 2],
            color: '#111111'
          },
          {
            name: 'seat_right',
            shape: 'cuboid',
            width: 0.8,
            height: 0.6,
            depth: 0.8,
            position: [0.9, 1.1, 2],
            color: '#111111'
          },
          {
            name: 'engine',
            shape: 'cuboid',
            width: 0.7,
            height: 1.2,
            depth: 0.5,
            position: [0, 1.1, -6],
            color: '#666666'
          },
          {
            name: 'propeller',
            shape: 'cylinder',
            radius: 0.3,
            height: 0.1,
            position: [0, 0.9, -6.5],
            rotation: [90, 0, 0],
            color: '#c0c0c0'
          },
          {
            name: 'bow_light',
            shape: 'sphere',
            radius: 0.15,
            position: [0, 1.2, 6],
            color: '#ffff00',
            emissive: true
          },
          {
            name: 'stern_light',
            shape: 'sphere',
            radius: 0.15,
            position: [0, 1.2, -6],
            color: '#ff0000',
            emissive: true
          },
          {
            name: 'port_light',
            shape: 'sphere',
            radius: 0.1,
            position: [-1.4, 1.2, 0],
            color: '#ff0000',
            emissive: true
          },
          {
            name: 'starboard_light',
            shape: 'sphere',
            radius: 0.1,
            position: [1.4, 1.2, 0],
            color: '#00ff00',
            emissive: true
          }
        ]
      },
      { 
        id: 'airplane', 
        name: 'Detailed Airliner (Low-Poly, Procedural)', 
        type: 'airplane', 
        description: 'A highly-detailed low-poly airplane assembled from primitives: fuselage, nose, cockpit, wings, flaps, engines, landing gear, lights, windows, decals, and animated systems',
        assetType: 'airplane',
        parts: [
          // Fuselage and Cockpit
          {
            name: 'fuselage_main',
            shape: 'cylinder',
            radius: 2.0,
            height: 30.0,
            position: [0, 2, 0],
            rotation: [0, 0, 90],
            color: '#F5F7FA'
          },
          {
            name: 'nose_cone',
            shape: 'cone',
            radius: 2.0,
            height: 3.2,
            position: [15.8, 2, 0],
            rotation: [0, 0, 90],
            color: '#F5F7FA'
          },
          {
            name: 'tail_taper',
            shape: 'cone',
            radius: 1.0,
            height: 3.0,
            position: [-15.8, 2, 0],
            rotation: [0, 0, -90],
            color: '#F5F7FA'
          },
          {
            name: 'cockpit_dome',
            shape: 'sphere',
            radius: 1.6,
            position: [10.6, 3.05, 0],
            color: '#78C2E8',
            transparency: 0.45
          },
          {
            name: 'cockpit_frame',
            shape: 'cuboid',
            width: 2.6,
            height: 0.12,
            depth: 1.8,
            position: [10.6, 2.55, 0],
            color: '#616161'
          },
          {
            name: 'door_left',
            shape: 'cuboid',
            width: 0.8,
            height: 2.0,
            depth: 0.05,
            position: [6.4, 1.0, -2.05],
            color: '#F5F7FA'
          },
          {
            name: 'door_right',
            shape: 'cuboid',
            width: 0.8,
            height: 2.0,
            depth: 0.05,
            position: [6.4, 1.0, 2.05],
            color: '#F5F7FA'
          },
          // Cabin Windows
          {
            name: 'cabin_window_1',
            shape: 'cuboid',
            width: 0.35,
            height: 0.35,
            depth: 0.05,
            position: [8.0, 2.2, 3.0],
            color: '#78C2E8',
            transparency: 0.5
          },
          {
            name: 'cabin_window_2',
            shape: 'cuboid',
            width: 0.35,
            height: 0.35,
            depth: 0.05,
            position: [5.6, 2.2, 3.0],
            color: '#78C2E8',
            transparency: 0.5
          },
          {
            name: 'cabin_window_3',
            shape: 'cuboid',
            width: 0.35,
            height: 0.35,
            depth: 0.05,
            position: [2.8, 2.2, 3.0],
            color: '#78C2E8',
            transparency: 0.5
          },
          {
            name: 'cabin_window_4',
            shape: 'cuboid',
            width: 0.35,
            height: 0.35,
            depth: 0.05,
            position: [-0.5, 2.2, 3.0],
            color: '#78C2E8',
            transparency: 0.5
          },
          {
            name: 'cabin_window_5',
            shape: 'cuboid',
            width: 0.35,
            height: 0.35,
            depth: 0.05,
            position: [-3.7, 2.2, 3.0],
            color: '#78C2E8',
            transparency: 0.5
          },
          {
            name: 'cabin_window_6',
            shape: 'cuboid',
            width: 0.35,
            height: 0.35,
            depth: 0.05,
            position: [-6.2, 2.2, 3.0],
            color: '#78C2E8',
            transparency: 0.5
          },
          {
            name: 'decal_stripe_top',
            shape: 'cuboid',
            width: 30.5,
            height: 0.02,
            depth: 0.5,
            position: [0, 3.05, 0],
            color: '#7B5FB8'
          },
          // Wings and Control Surfaces
          {
            name: 'left_wing',
            shape: 'cuboid',
            width: 18.0,
            height: 0.35,
            depth: 3.5,
            position: [0.6, 2.0, -9.5],
            color: '#F5F7FA'
          },
          {
            name: 'right_wing',
            shape: 'cuboid',
            width: 18.0,
            height: 0.35,
            depth: 3.5,
            position: [0.6, 2.0, 9.5],
            color: '#F5F7FA'
          },
          {
            name: 'left_aileron',
            shape: 'cuboid',
            width: 4.4,
            height: 0.12,
            depth: 1.0,
            position: [6.6, 2.0, -12.0],
            color: '#7B5FB8'
          },
          {
            name: 'right_aileron',
            shape: 'cuboid',
            width: 4.4,
            height: 0.12,
            depth: 1.0,
            position: [6.6, 2.0, 12.0],
            color: '#7B5FB8'
          },
          {
            name: 'left_flap',
            shape: 'cuboid',
            width: 6.2,
            height: 0.14,
            depth: 0.9,
            position: [2.4, 2.0, -10.8],
            color: '#F5F7FA'
          },
          {
            name: 'right_flap',
            shape: 'cuboid',
            width: 6.2,
            height: 0.14,
            depth: 0.9,
            position: [2.4, 2.0, 10.8],
            color: '#F5F7FA'
          },
          {
            name: 'left_winglet',
            shape: 'cuboid',
            width: 0.3,
            height: 0.9,
            depth: 0.6,
            position: [9.9, 2.5, -13.9],
            rotation: [0, 0, 8],
            color: '#7B5FB8'
          },
          {
            name: 'right_winglet',
            shape: 'cuboid',
            width: 0.3,
            height: 0.9,
            depth: 0.6,
            position: [9.9, 2.5, 13.9],
            rotation: [0, 0, -8],
            color: '#7B5FB8'
          },
          // Engines
          {
            name: 'left_engine_nacelle',
            shape: 'cylinder',
            radius: 1.25,
            height: 3.5,
            position: [2.4, 1.0, -6.0],
            rotation: [0, 0, 90],
            color: '#616161'
          },
          {
            name: 'right_engine_nacelle',
            shape: 'cylinder',
            radius: 1.25,
            height: 3.5,
            position: [2.4, 1.0, 6.0],
            rotation: [0, 0, 90],
            color: '#616161'
          },
          {
            name: 'left_engine_fan',
            shape: 'cylinder',
            radius: 1.1,
            height: 0.08,
            position: [3.95, 1.0, -6.0],
            rotation: [0, 90, 0],
            color: '#B0B6BD'
          },
          {
            name: 'right_engine_fan',
            shape: 'cylinder',
            radius: 1.1,
            height: 0.08,
            position: [3.95, 1.0, 6.0],
            rotation: [0, 90, 0],
            color: '#B0B6BD'
          },
          {
            name: 'left_engine_exhaust',
            shape: 'cylinder',
            radius: 0.6,
            height: 0.5,
            position: [1.15, 1.0, -6.0],
            rotation: [0, 0, 90],
            color: '#616161'
          },
          {
            name: 'right_engine_exhaust',
            shape: 'cylinder',
            radius: 0.6,
            height: 0.5,
            position: [1.15, 1.0, 6.0],
            rotation: [0, 0, 90],
            color: '#616161'
          },
          // Tail and Stabilizers
          {
            name: 'vertical_stabilizer',
            shape: 'cuboid',
            width: 0.5,
            height: 4.2,
            depth: 1.8,
            position: [-14.2, 4.2, 0],
            color: '#7B5FB8'
          },
          {
            name: 'rudder',
            shape: 'cuboid',
            width: 0.08,
            height: 3.6,
            depth: 1.6,
            position: [-14.2, 4.2, 0],
            color: '#7B5FB8'
          },
          {
            name: 'horizontal_stab_left',
            shape: 'cuboid',
            width: 4.4,
            height: 0.2,
            depth: 1.0,
            position: [-13.6, 3.0, -3.4],
            color: '#F5F7FA'
          },
          {
            name: 'horizontal_stab_right',
            shape: 'cuboid',
            width: 4.4,
            height: 0.2,
            depth: 1.0,
            position: [-13.6, 3.0, 3.4],
            color: '#F5F7FA'
          },
          // Landing Gear
          {
            name: 'nose_gear_strut',
            shape: 'cylinder',
            radius: 0.18,
            height: 1.2,
            position: [11.5, 0.0, 0],
            color: '#616161'
          },
          {
            name: 'nose_gear_wheel',
            shape: 'cylinder',
            radius: 0.45,
            height: 0.28,
            position: [11.5, -0.6, 0],
            rotation: [90, 0, 0],
            color: '#111111'
          },
          {
            name: 'main_gear_left_strut',
            shape: 'cylinder',
            radius: 0.20,
            height: 1.6,
            position: [-2.8, 0.0, -4.5],
            color: '#616161'
          },
          {
            name: 'main_gear_left_wheel',
            shape: 'cylinder',
            radius: 0.75,
            height: 0.32,
            position: [-2.8, -0.7, -4.5],
            rotation: [90, 0, 0],
            color: '#111111'
          },
          {
            name: 'main_gear_right_strut',
            shape: 'cylinder',
            radius: 0.20,
            height: 1.6,
            position: [-2.8, 0.0, 4.5],
            color: '#616161'
          },
          {
            name: 'main_gear_right_wheel',
            shape: 'cylinder',
            radius: 0.75,
            height: 0.32,
            position: [-2.8, -0.7, 4.5],
            rotation: [90, 0, 0],
            color: '#111111'
          },
          {
            name: 'gear_doors_left',
            shape: 'cuboid',
            width: 1.1,
            height: 0.08,
            depth: 0.6,
            position: [-2.2, 0.9, -4.5],
            color: '#F5F7FA'
          },
          {
            name: 'gear_doors_right',
            shape: 'cuboid',
            width: 1.1,
            height: 0.08,
            depth: 0.6,
            position: [-2.2, 0.9, 4.5],
            color: '#F5F7FA'
          },
          // Lights and Antennae
          {
            name: 'left_nav_light',
            shape: 'sphere',
            radius: 0.18,
            position: [9.9, 2.2, -13.9],
            color: '#FF1E1E',
            emissive: true
          },
          {
            name: 'right_nav_light',
            shape: 'sphere',
            radius: 0.18,
            position: [9.9, 2.2, 13.9],
            color: '#00E14A',
            emissive: true
          },
          {
            name: 'tail_strobe',
            shape: 'sphere',
            radius: 0.2,
            position: [-15.4, 3.6, 0],
            color: '#FFFFFF',
            emissive: true
          },
          {
            name: 'antennas_top',
            shape: 'cylinder',
            radius: 0.04,
            height: 0.8,
            position: [1.6, 3.8, 0],
            color: '#616161'
          },
          // Decor and Extras
          {
            name: 'logo_left',
            shape: 'cuboid',
            width: 2.2,
            height: 1.2,
            depth: 0.01,
            position: [2.0, 3.0, -2.5],
            color: '#7B5FB8'
          },
          {
            name: 'logo_right',
            shape: 'cuboid',
            width: 2.2,
            height: 1.2,
            depth: 0.01,
            position: [2.0, 3.0, 2.5],
            color: '#7B5FB8'
          },
          {
            name: 'wing_registration_left',
            shape: 'cuboid',
            width: 1.0,
            height: 0.28,
            depth: 0.01,
            position: [7.0, 2.35, -3.0],
            color: '#7B5FB8'
          },
          {
            name: 'wing_registration_right',
            shape: 'cuboid',
            width: 1.0,
            height: 0.28,
            depth: 0.01,
            position: [7.0, 2.35, 3.0],
            color: '#7B5FB8'
          }
        ]
      }
    ]
  },
  'characters': {
    id: 'characters',
    name: 'Characters & NPCs',
    description: 'Placeholder characters for testing gameplay before adding real assets.',
    icon: '👤',
    color: '#8b5cf6',
    assets: [
      { 
        id: 'humanoid-rig', 
        name: 'Humanoid Rig', 
        type: 'humanoid-rig', 
        description: 'Stick figure or capsule man',
        assetType: 'humanoid-rig',
        parts: [
          { shape: 'sphere', radius: 0.2, position: [0, 1.7, 0] }, // Head
          { shape: 'capsule', radius: 0.1, height: 0.8, position: [0, 1.2, 0] }, // Torso
          { shape: 'capsule', radius: 0.08, height: 0.6, position: [-0.3, 0.7, 0] }, // Left arm
          { shape: 'capsule', radius: 0.08, height: 0.6, position: [0.3, 0.7, 0] }, // Right arm
          { shape: 'capsule', radius: 0.1, height: 0.8, position: [-0.15, 0.2, 0] }, // Left leg
          { shape: 'capsule', radius: 0.1, height: 0.8, position: [0.15, 0.2, 0] } // Right leg
        ]
      },
      { 
        id: 'animal-dog', 
        name: 'Dog Silhouette', 
        type: 'animal-dog', 
        description: 'Simple dog placeholder',
        assetType: 'animal-dog',
        parts: [
          { shape: 'sphere', radius: 0.15, position: [0, 0.3, 0.2] }, // Head
          { shape: 'capsule', radius: 0.08, height: 0.3, position: [0, 0.15, 0] }, // Body
          { shape: 'capsule', radius: 0.05, height: 0.2, position: [-0.2, 0.1, 0] }, // Left leg
          { shape: 'capsule', radius: 0.05, height: 0.2, position: [0.2, 0.1, 0] }, // Right leg
          { shape: 'capsule', radius: 0.03, height: 0.15, position: [-0.1, 0.2, 0.3] }, // Left ear
          { shape: 'capsule', radius: 0.03, height: 0.15, position: [0.1, 0.2, 0.3] } // Right ear
        ]
      },
      { 
        id: 'animal-cat', 
        name: 'Cat Silhouette', 
        type: 'animal-cat', 
        description: 'Simple cat placeholder',
        assetType: 'animal-cat',
        parts: [
          { shape: 'sphere', radius: 0.12, position: [0, 0.25, 0.15] }, // Head
          { shape: 'capsule', radius: 0.06, height: 0.25, position: [0, 0.1, 0] }, // Body
          { shape: 'capsule', radius: 0.04, height: 0.15, position: [-0.15, 0.05, 0] }, // Left leg
          { shape: 'capsule', radius: 0.04, height: 0.15, position: [0.15, 0.05, 0] }, // Right leg
          { shape: 'cone', radius: 0.05, height: 0.1, position: [-0.05, 0.3, 0.2] }, // Left ear
          { shape: 'cone', radius: 0.05, height: 0.1, position: [0.05, 0.3, 0.2] } // Right ear
        ]
      },
      { 
        id: 'mario-character', 
        name: 'Mario Character', 
        type: '3d-model', 
        description: 'Classic Mario character model in GLB format',
        assetType: '3d-model',
        fileUrl: '/mario.glb',
        thumbnail: '/mario-preview.jpg',
        tags: ['mario', 'character', 'nintendo', 'classic', '3d-model'],
        scale: [1, 1, 1],
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      { 
        id: 'enemy-blob', 
        name: 'Enemy Blob', 
        type: 'enemy-blob', 
        description: 'Sphere with eyes for enemies',
        assetType: 'enemy-blob',
        parts: [
          { shape: 'sphere', radius: 0.5, position: [0, 0.5, 0] }, // Body
          { shape: 'sphere', radius: 0.1, position: [-0.2, 0.6, 0.3] }, // Left eye
          { shape: 'sphere', radius: 0.1, position: [0.2, 0.6, 0.3] }, // Right eye
          { shape: 'sphere', radius: 0.05, position: [-0.2, 0.6, 0.35] }, // Left pupil
          { shape: 'sphere', radius: 0.05, position: [0.2, 0.6, 0.35] } // Right pupil
        ]
      }
    ]
  },
  'game-objects': {
    id: 'game-objects',
    name: 'Game Objects',
    description: 'Gameplay helpers and interactive objects for game development.',
    icon: '🎮',
    color: '#f97316',
    assets: [
      { 
        id: 'coin', 
        name: 'Coin', 
        type: 'coin', 
        description: 'Collectible gold coin',
        assetType: 'coin',
        parts: [
          { shape: 'cylinder', radius: 0.3, height: 0.05, position: [0, 0.025, 0] }, // Coin body
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.02, position: [0, 0.05, 0] } // Center detail
        ]
      },
      { 
        id: 'gem', 
        name: 'Gem', 
        type: 'gem', 
        description: 'Precious gem collectible',
        assetType: 'gem',
        parts: [
          { shape: 'pyramid', width: 0.4, height: 0.6, depth: 0.4, position: [0, 0.3, 0] }, // Gem body
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.1, position: [0, 0.7, 0] } // Top facet
        ]
      },
      { 
        id: 'key', 
        name: 'Key', 
        type: 'key', 
        description: 'Door key with ring',
        assetType: 'key',
        parts: [
          { shape: 'torus', radius: 0.15, tube: 0.03, position: [0, 0.15, 0] }, // Ring
          { shape: 'cube', width: 0.3, height: 0.05, depth: 0.05, position: [0.2, 0.15, 0] }, // Shaft
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.05, position: [0.35, 0.15, 0] } // Teeth
        ]
      },
      { 
        id: 'treasure-chest', 
        name: 'Treasure Chest', 
        type: 'treasure-chest', 
        description: 'Wooden chest with lock',
        assetType: 'treasure-chest',
        parts: [
          { shape: 'cube', width: 1, height: 0.6, depth: 0.8, position: [0, 0.3, 0] }, // Base
          { shape: 'cube', width: 1, height: 0.1, depth: 0.8, position: [0, 0.7, 0] }, // Lid
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.1, position: [0.3, 0.7, 0.3] }, // Lock
          { shape: 'cube', width: 0.05, height: 0.05, depth: 0.05, position: [0.35, 0.7, 0.35] } // Keyhole
        ]
      },
      { 
        id: 'pressure-plate', 
        name: 'Pressure Plate', 
        type: 'pressure-plate', 
        description: 'Door trigger plate',
        assetType: 'pressure-plate',
        parts: [
          { shape: 'cube', width: 1, height: 0.1, depth: 1, position: [0, 0.05, 0] }, // Plate
          { shape: 'cube', width: 0.1, height: 0.2, depth: 0.1, position: [-0.4, 0.1, -0.4] }, // Corner 1
          { shape: 'cube', width: 0.1, height: 0.2, depth: 0.1, position: [0.4, 0.1, -0.4] }, // Corner 2
          { shape: 'cube', width: 0.1, height: 0.2, depth: 0.1, position: [-0.4, 0.1, 0.4] }, // Corner 3
          { shape: 'cube', width: 0.1, height: 0.2, depth: 0.1, position: [0.4, 0.1, 0.4] } // Corner 4
        ]
      },
      { 
        id: 'checkpoint-flag', 
        name: 'Checkpoint Flag', 
        type: 'checkpoint-flag', 
        description: 'Save point marker',
        assetType: 'checkpoint-flag',
        parts: [
          { shape: 'cylinder', radius: 0.05, height: 2, position: [0, 1, 0] }, // Pole
          { shape: 'cube', width: 0.8, height: 0.4, depth: 0.05, position: [0.4, 1.5, 0] }, // Flag
          { shape: 'sphere', radius: 0.1, position: [0, 2.1, 0] } // Top sphere
        ]
      },
      { 
        id: 'sword', 
        name: 'Sword', 
        type: 'sword', 
        description: 'Basic melee weapon',
        assetType: 'sword',
        parts: [
          { shape: 'cube', width: 0.1, height: 1.2, depth: 0.05, position: [0, 0.6, 0] }, // Blade
          { shape: 'cube', width: 0.2, height: 0.1, depth: 0.1, position: [0, 0.05, 0] }, // Guard
          { shape: 'cylinder', radius: 0.05, height: 0.3, position: [0, -0.1, 0] } // Handle
        ]
      },
      { 
        id: 'gun', 
        name: 'Gun', 
        type: 'gun', 
        description: 'Simple ranged weapon',
        assetType: 'gun',
        parts: [
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.8, position: [0, 0.05, 0.4] }, // Barrel
          { shape: 'cube', width: 0.2, height: 0.15, depth: 0.3, position: [0, 0.075, 0] }, // Body
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.2, position: [0, 0.05, -0.1] }, // Handle
          { shape: 'cube', width: 0.05, height: 0.05, depth: 0.05, position: [0, 0.1, 0.8] } // Sight
        ]
      },
      { 
        id: 'staff', 
        name: 'Staff', 
        type: 'staff', 
        description: 'Magic staff weapon',
        assetType: 'staff',
        parts: [
          { shape: 'cylinder', radius: 0.03, height: 1.5, position: [0, 0.75, 0] }, // Staff
          { shape: 'sphere', radius: 0.15, position: [0, 1.6, 0] }, // Crystal orb
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.1, position: [0, 0.05, 0] } // Base
        ]
      },
      { 
        id: 'ball', 
        name: 'Ball', 
        type: 'ball', 
        description: 'Physics ball for games',
        assetType: 'ball',
        parts: [
          { shape: 'sphere', radius: 0.3, position: [0, 0.3, 0] } // Ball body
        ]
      }
    ]
  },
  'environment-fx': {
    id: 'environment-fx',
    name: 'Environment & FX',
    description: 'Environmental objects and special effects for immersive scenes.',
    icon: '🔥',
    color: '#dc2626',
    assets: [
      { 
        id: 'torch', 
        name: 'Torch', 
        type: 'torch', 
        description: 'Torch with low-poly flame',
        assetType: 'torch',
        parts: [
          { shape: 'cylinder', radius: 0.05, height: 1, position: [0, 0.5, 0] }, // Handle
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.1, position: [0, 1.05, 0] }, // Head
          { shape: 'sphere', radius: 0.2, position: [0, 1.2, 0] } // Flame
        ]
      },
      { 
        id: 'campfire', 
        name: 'Campfire', 
        type: 'campfire', 
        description: 'Wooden campfire setup',
        assetType: 'campfire',
        parts: [
          { shape: 'cube', width: 0.1, height: 0.8, depth: 0.1, position: [-0.3, 0.4, 0] }, // Log 1
          { shape: 'cube', width: 0.1, height: 0.8, depth: 0.1, position: [0.3, 0.4, 0] }, // Log 2
          { shape: 'cube', width: 0.1, height: 0.8, depth: 0.1, position: [0, 0.4, -0.3] }, // Log 3
          { shape: 'cube', width: 0.1, height: 0.8, depth: 0.1, position: [0, 0.4, 0.3] }, // Log 4
          { shape: 'sphere', radius: 0.3, position: [0, 0.8, 0] } // Fire
        ]
      },
      { 
        id: 'barrel', 
        name: 'Barrel', 
        type: 'barrel', 
        description: 'Wooden storage barrel',
        assetType: 'barrel',
        parts: [
          { shape: 'cylinder', radius: 0.4, height: 0.8, position: [0, 0.4, 0] }, // Main body
          { shape: 'cylinder', radius: 0.45, height: 0.1, position: [0, 0.85, 0] }, // Top rim
          { shape: 'cylinder', radius: 0.45, height: 0.1, position: [0, -0.05, 0] }, // Bottom rim
          { shape: 'cube', width: 0.1, height: 0.8, depth: 0.05, position: [0, 0.4, 0.4] } // Stave
        ]
      },
      { 
        id: 'crate', 
        name: 'Crate', 
        type: 'crate', 
        description: 'Wooden shipping crate',
        assetType: 'crate',
        parts: [
          { shape: 'cube', width: 1, height: 1, depth: 1, position: [0, 0.5, 0] }, // Main box
          { shape: 'cube', width: 0.05, height: 1, depth: 0.05, position: [-0.475, 0.5, -0.475] }, // Corner 1
          { shape: 'cube', width: 0.05, height: 1, depth: 0.05, position: [0.475, 0.5, -0.475] }, // Corner 2
          { shape: 'cube', width: 0.05, height: 1, depth: 0.05, position: [-0.475, 0.5, 0.475] }, // Corner 3
          { shape: 'cube', width: 0.05, height: 1, depth: 0.05, position: [0.475, 0.5, 0.475] } // Corner 4
        ]
      },
      { 
        id: 'bridge-segment', 
        name: 'Bridge Segment', 
        type: 'bridge-segment', 
        description: 'Modular bridge piece',
        assetType: 'bridge-segment',
        parts: [
          { shape: 'cube', width: 2, height: 0.1, depth: 4, position: [0, 0.05, 0] }, // Deck
          { shape: 'cube', width: 0.1, height: 1, depth: 0.1, position: [-0.9, 0.5, -1.8] }, // Support 1
          { shape: 'cube', width: 0.1, height: 1, depth: 0.1, position: [0.9, 0.5, -1.8] }, // Support 2
          { shape: 'cube', width: 0.1, height: 1, depth: 0.1, position: [-0.9, 0.5, 1.8] }, // Support 3
          { shape: 'cube', width: 0.1, height: 1, depth: 0.1, position: [0.9, 0.5, 1.8] }, // Support 4
          { shape: 'cube', width: 2, height: 0.05, depth: 0.1, position: [0, 0.6, -1.8] }, // Rail 1
          { shape: 'cube', width: 2, height: 0.05, depth: 0.1, position: [0, 0.6, 1.8] } // Rail 2
        ]
      },
      { 
        id: 'signpost', 
        name: 'Signpost', 
        type: 'signpost', 
        description: 'Editable text sign',
        assetType: 'signpost',
        parts: [
          { shape: 'cylinder', radius: 0.05, height: 1.5, position: [0, 0.75, 0] }, // Post
          { shape: 'cube', width: 1, height: 0.6, depth: 0.05, position: [0, 1.2, 0] }, // Sign board
          { shape: 'cube', width: 0.1, height: 0.1, depth: 0.1, position: [0, 1.5, 0] } // Top cap
        ]
      }
    ]
  }
};

// Helper function to get all assets as a flat array
export const getAllAssets = () => {
  return Object.values(ASSET_PACKS).flatMap(pack => 
    pack.assets.map(asset => ({
      ...asset,
      packId: pack.id,
      packName: pack.name,
      packIcon: pack.icon,
      packColor: pack.color
    }))
  );
};

// Helper function to search assets
export const searchAssets = (query, packId = null) => {
  const allAssets = getAllAssets();
  const filtered = allAssets.filter(asset => {
    const matchesQuery = asset.name.toLowerCase().includes(query.toLowerCase()) ||
                        asset.description.toLowerCase().includes(query.toLowerCase()) ||
                        asset.type.toLowerCase().includes(query.toLowerCase());
    const matchesPack = !packId || asset.packId === packId;
    return matchesQuery && matchesPack;
  });
  return filtered;
};

// Helper function to get assets by pack
export const getAssetsByPack = (packId) => {
  const pack = ASSET_PACKS[packId];
  return pack ? pack.assets : [];
};

// Helper function to get pack info
export const getPackInfo = (packId) => {
  return ASSET_PACKS[packId] || null;
};

// Helper function to get all packs
export const getAllPacks = () => {
  return Object.values(ASSET_PACKS);
};
