
import React, { useState, useEffect } from 'react';
import { MCPGateway, MCPTool, StructuredContent } from '../../lib/mcp-gateway';
import LoadingSpinner from '../UI/LoadingSpinner';

interface MCPPlaygroundProps {
  userId: string;
  hasConnection: boolean;
}

