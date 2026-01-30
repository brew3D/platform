#!/usr/bin/env node

/**
 * Populate Brew 3D Asset Library in DynamoDB
 * This script populates the ruchi-ai-assets table with all the comprehensive asset library
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DDB_ASSETS_TABLE || 'ruchi-ai-assets';

// Asset Library Data
const ASSET_PACKS = {
  'basic-shapes': {
    id: 'basic-shapes',
    name: 'Basic Shapes',
    description: 'Core building blocks for any 3D scene. Parameterized primitives with customizable dimensions.',
    icon: '🟦',
    color: '#8b5a2b',
    assets: [
      { id: 'cube', name: 'Cube', type: 'cube', description: 'Box with customizable width, height, and depth' },
      { id: 'sphere', name: 'Sphere', type: 'sphere', description: 'Perfect sphere with adjustable radius' },
      { id: 'cylinder', name: 'Cylinder', type: 'cylinder', description: 'Cylindrical shape with radius and height' },
      { id: 'cone', name: 'Cone', type: 'cone', description: 'Cone with base radius and height' },
      { id: 'torus', name: 'Torus', type: 'torus', description: 'Donut shape with inner and outer radius' },
      { id: 'capsule', name: 'Capsule', type: 'capsule', description: 'Rounded cylinder with hemispherical ends' },
      { id: 'plane', name: 'Plane', type: 'plane', description: 'Flat surface for floors, walls, and platforms' },
      { id: 'pyramid', name: 'Pyramid', type: 'pyramid', description: 'Four-sided pyramid with square base' },
      { id: 'prism-triangular', name: 'Triangular Prism', type: 'prism-triangular', description: 'Three-sided prism' },
      { id: 'prism-hexagonal', name: 'Hexagonal Prism', type: 'prism-hexagonal', description: 'Six-sided prism' }
    ]
  },
  'nature-pack': {
    id: 'nature-pack',
    name: 'Nature Pack',
    description: 'Natural assets for outdoor environments. Low-poly stylized models perfect for any scene.',
    icon: '🌿',
    color: '#4ade80',
    assets: [
      { id: 'tree', name: 'Tree', type: 'tree', description: 'Low-poly stylized tree with trunk and leaves' },
      { id: 'bush', name: 'Bush', type: 'bush', description: 'Small shrub for landscaping' },
      { id: 'grass-patch-1', name: 'Grass Patch Type 1', type: 'grass-patch-1', description: 'Natural grass cluster' },
      { id: 'grass-patch-2', name: 'Grass Patch Type 2', type: 'grass-patch-2', description: 'Alternative grass style' },
      { id: 'rock', name: 'Rock', type: 'rock', description: 'Irregular rock formation' },
      { id: 'water-plane', name: 'Water Plane', type: 'water-plane', description: 'Flat water surface for ponds' },
      { id: 'cloud', name: 'Cloud', type: 'cloud', description: 'Puffy cloud cluster' },
      { id: 'mountain', name: 'Mountain', type: 'mountain', description: 'Hill with noise-based terrain' }
    ]
  },
  'furniture-props': {
    id: 'furniture-props',
    name: 'Furniture & Props',
    description: 'Interior basics for house scenes, RPG interiors, and indoor environments.',
    icon: '🪑',
    color: '#f59e0b',
    assets: [
      { id: 'chair', name: 'Chair', type: 'chair', description: 'Standard four-legged chair' },
      { id: 'table-square', name: 'Square Table', type: 'table-square', description: 'Rectangular dining table' },
      { id: 'table-round', name: 'Round Table', type: 'table-round', description: 'Circular table' },
      { id: 'bed', name: 'Bed', type: 'bed', description: 'Single bed with headboard' },
      { id: 'sofa', name: 'Sofa', type: 'sofa', description: 'Three-seat couch' },
      { id: 'bookshelf', name: 'Bookshelf', type: 'bookshelf', description: 'Tall bookcase with shelves' },
      { id: 'cabinet', name: 'Cabinet', type: 'cabinet', description: 'Storage cabinet with drawers' },
      { id: 'lamp', name: 'Lamp', type: 'lamp', description: 'Table lamp with base and shade' },
      { id: 'rug', name: 'Rug', type: 'rug', description: 'Decorative carpet plane' }
    ]
  },
  'building-blocks': {
    id: 'building-blocks',
    name: 'Building Blocks',
    description: 'Architecture components for constructing buildings, houses, and structures.',
    icon: '🏗️',
    color: '#ef4444',
    assets: [
      { id: 'wall', name: 'Wall', type: 'wall', description: 'Basic wall segment' },
      { id: 'wall-window', name: 'Wall with Window', type: 'wall-window', description: 'Wall with window cutout' },
      { id: 'door', name: 'Door', type: 'door', description: 'Rectangular door with hinge pivot' },
      { id: 'window-frame', name: 'Window Frame', type: 'window-frame', description: 'Standalone window frame' },
      { id: 'stairs-straight', name: 'Straight Stairs', type: 'stairs-straight', description: 'Linear staircase' },
      { id: 'stairs-spiral', name: 'Spiral Stairs', type: 'stairs-spiral', description: 'Curved spiral staircase' },
      { id: 'fence', name: 'Fence Segment', type: 'fence', description: 'Basic fence panel' },
      { id: 'roof', name: 'Roof', type: 'roof', description: 'Triangular roof section' },
      { id: 'column', name: 'Column', type: 'column', description: 'Decorative pillar' },
      { id: 'archway', name: 'Archway', type: 'archway', description: 'Curved architectural arch' }
    ]
  },
  'vehicles': {
    id: 'vehicles',
    name: 'Vehicles & Movement',
    description: 'Low-poly vehicles and movement objects. Symbolic designs perfect for MVP testing.',
    icon: '🚗',
    color: '#06b6d4',
    assets: [
      { id: 'car-body', name: 'Car Body', type: 'car-body', description: 'Blocky car chassis' },
      { id: 'wheel', name: 'Wheel', type: 'wheel', description: 'Standard vehicle wheel' },
      { id: 'boat-hull', name: 'Boat Hull', type: 'boat-hull', description: 'Basic boat shape' },
      { id: 'airplane', name: 'Airplane', type: 'airplane', description: 'Toy-like aircraft with wings' }
    ]
  },
  'characters': {
    id: 'characters',
    name: 'Characters & NPCs',
    description: 'Placeholder characters for testing gameplay before adding real assets.',
    icon: '👤',
    color: '#8b5cf6',
    assets: [
      { id: 'humanoid-rig', name: 'Humanoid Rig', type: 'humanoid-rig', description: 'Stick figure or capsule man' },
      { id: 'animal-dog', name: 'Dog Silhouette', type: 'animal-dog', description: 'Simple dog placeholder' },
      { id: 'animal-cat', name: 'Cat Silhouette', type: 'animal-cat', description: 'Simple cat placeholder' },
      { id: 'enemy-blob', name: 'Enemy Blob', type: 'enemy-blob', description: 'Sphere with eyes for enemies' }
    ]
  },
  'game-objects': {
    id: 'game-objects',
    name: 'Game Objects',
    description: 'Gameplay helpers and interactive objects for game development.',
    icon: '🎮',
    color: '#f97316',
    assets: [
      { id: 'coin', name: 'Coin', type: 'coin', description: 'Collectible gold coin' },
      { id: 'gem', name: 'Gem', type: 'gem', description: 'Precious gem collectible' },
      { id: 'key', name: 'Key', type: 'key', description: 'Door key with ring' },
      { id: 'treasure-chest', name: 'Treasure Chest', type: 'treasure-chest', description: 'Wooden chest with lock' },
      { id: 'pressure-plate', name: 'Pressure Plate', type: 'pressure-plate', description: 'Door trigger plate' },
      { id: 'checkpoint-flag', name: 'Checkpoint Flag', type: 'checkpoint-flag', description: 'Save point marker' },
      { id: 'sword', name: 'Sword', type: 'sword', description: 'Basic melee weapon' },
      { id: 'gun', name: 'Gun', type: 'gun', description: 'Simple ranged weapon' },
      { id: 'staff', name: 'Staff', type: 'staff', description: 'Magic staff weapon' },
      { id: 'ball', name: 'Ball', type: 'ball', description: 'Physics ball for games' }
    ]
  },
  'environment-fx': {
    id: 'environment-fx',
    name: 'Environment & FX',
    description: 'Environmental objects and special effects for immersive scenes.',
    icon: '🔥',
    color: '#dc2626',
    assets: [
      { id: 'torch', name: 'Torch', type: 'torch', description: 'Torch with low-poly flame' },
      { id: 'campfire', name: 'Campfire', type: 'campfire', description: 'Wooden campfire setup' },
      { id: 'barrel', name: 'Barrel', type: 'barrel', description: 'Wooden storage barrel' },
      { id: 'crate', name: 'Crate', type: 'crate', description: 'Wooden shipping crate' },
      { id: 'bridge-segment', name: 'Bridge Segment', type: 'bridge-segment', description: 'Modular bridge piece' },
      { id: 'signpost', name: 'Signpost', type: 'signpost', description: 'Editable text sign' }
    ]
  }
};

// Generate unique asset IDs
function generateAssetId(packId, assetId) {
  return `asset-${packId}-${assetId}`;
}

// Get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Create asset item for DynamoDB
function createAssetItem(pack, asset) {
  const assetId = generateAssetId(pack.id, asset.id);
  const timestamp = getCurrentTimestamp();
  
  return {
    assetId,
    name: asset.name,
    description: asset.description,
    category: pack.id,
    type: '3d-model',
    creatorId: 'ruchi-ai-system',
    fileUrl: '', // Will be populated when actual 3D models are added
    thumbnail: '', // Will be populated when thumbnails are generated
    tags: [pack.name.toLowerCase(), asset.type, 'free', 'starter'],
    price: 0,
    isFree: true,
    downloadCount: 0,
    rating: 0,
    reviews: [],
    status: 'approved',
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: timestamp,
    // Additional metadata
    packId: pack.id,
    packName: pack.name,
    packIcon: pack.icon,
    packColor: pack.color,
    assetType: asset.assetType || asset.type,
    // Multi-part object definition
    parts: asset.parts || []
  };
}

// Batch write items to DynamoDB
async function batchWriteItems(items) {
  const batchSize = 25; // DynamoDB batch write limit
  const batches = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    const requestItems = batch.map(item => ({
      PutRequest: {
        Item: item
      }
    }));
    
    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: requestItems
        }
      }));
      console.log(`✅ Batch of ${batch.length} items written successfully`);
    } catch (error) {
      console.error(`❌ Error writing batch:`, error);
      throw error;
    }
  }
}

// Main function
async function populateAssetLibrary() {
  console.log('🚀 Starting Brew 3D Asset Library population...');
  console.log(`📊 Table: ${TABLE_NAME}`);
  
  try {
    // Generate all asset items
    const allAssets = [];
    
    for (const pack of Object.values(ASSET_PACKS)) {
      console.log(`📦 Processing pack: ${pack.name} (${pack.assets.length} assets)`);
      
      for (const asset of pack.assets) {
        const assetItem = createAssetItem(pack, asset);
        allAssets.push(assetItem);
      }
    }
    
    console.log(`📈 Total assets to create: ${allAssets.length}`);
    
    // Write to DynamoDB
    await batchWriteItems(allAssets);
    
    console.log('✅ Asset library population completed successfully!');
    console.log(`📊 Created ${allAssets.length} assets across ${Object.keys(ASSET_PACKS).length} packs`);
    
    // Summary by pack
    console.log('\n📋 Summary by pack:');
    for (const pack of Object.values(ASSET_PACKS)) {
      console.log(`  ${pack.icon} ${pack.name}: ${pack.assets.length} assets`);
    }
    
  } catch (error) {
    console.error('❌ Error populating asset library:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateAssetLibrary();
}

module.exports = { populateAssetLibrary, ASSET_PACKS };
