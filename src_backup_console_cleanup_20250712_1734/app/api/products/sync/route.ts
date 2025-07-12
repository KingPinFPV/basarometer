import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const dataPath = path.join(process.cwd(), 'data/products.json');
    const productsData = await fs.readFile(dataPath, 'utf8');
    const products = JSON.parse(productsData);

    return NextResponse.json({ 
      products,
      count: products.length,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      products: [],
      count: 0
    }, { status: 500 });
  }
}