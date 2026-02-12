export interface Canvas {
  id: string
  name: string
  description?: string
  links: Link[]
  connections: Connection[]
  groups?: Group[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  createdAt: string
  updatedAt: string
}

export interface Link {
  id: string
  url: string
  title: string
  description?: string
  imageUrl?: string
  favicon?: string
  domain: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export interface Connection {
  id: string
  sourceId: string
  targetId: string
  label?: string
  color?: string
  style?: 'default' | 'dashed' | 'animated'
}

export interface Group {
  id: string
  name: string
  color: string
  x: number
  y: number
  width: number
  height: number
}

export interface LinkMetadata {
  url: string
  title: string
  description?: string
  imageUrl?: string
  favicon?: string
  domain: string
}
