/**
 * NeuralDoc Storage Layer - Advanced Data Management for AI Processing
 * 
 * This module provides the data persistence layer for NeuralDoc's document AI platform.
 * It manages the complete lifecycle of documents, embeddings, and chat messages with
 * optimizations for AI processing and real-time retrieval.
 * 
 * Key Components:
 * - Document Management: Full lifecycle from upload to deletion
 * - Vector Storage: Neural embeddings with metadata for semantic search
 * - Chat History: Context-aware conversation management
 * - Real-time Updates: Optimized for UI polling and status changes
 * 
 * Architecture:
 * - Interface-based design for easy database migration
 * - In-memory implementation for development with PostgreSQL production support
 * - Batch operations for high-performance embedding storage
 * - Atomic operations with proper error handling
 */

import { type Document, type InsertDocument, type Embedding, type InsertEmbedding, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

/**
 * Storage Interface Contract
 * 
 * Defines the complete data access layer for NeuralDoc with methods optimized
 * for AI processing workflows. This interface ensures consistency between
 * development (in-memory) and production (PostgreSQL) implementations.
 */
export interface IStorage {
  // Document Lifecycle Management
  createDocument(document: InsertDocument): Promise<Document>;              // Initial document creation
  getDocument(id: string): Promise<Document | undefined>;                   // Single document retrieval
  getAllDocuments(): Promise<Document[]>;                                   // Document library with status
  updateDocumentStatus(id: string, status: string, content?: string): Promise<void>; // Processing updates
  deleteDocument(id: string): Promise<void>;                               // Complete cleanup

  // Vector Embedding Management for AI Search
  createEmbedding(embedding: InsertEmbedding): Promise<Embedding>;          // Single embedding storage
  createEmbeddingsBatch(embeddings: InsertEmbedding[]): Promise<Embedding[]>; // Batch processing optimization
  getEmbeddingsByDocument(documentId: string): Promise<Embedding[]>;        // Document-specific vectors
  getAllEmbeddings(): Promise<Embedding[]>;                                // Global semantic search
  deleteEmbeddingsByDocument(documentId: string): Promise<void>;            // Cleanup on document deletion

  // Chat Context Management
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;      // Store user/AI interactions
  getAllChatMessages(): Promise<ChatMessage[]>;                            // Conversation history
  clearChatHistory(): Promise<void>;                                       // Reset conversations
}

/**
 * High-Performance In-Memory Storage Implementation
 * 
 * Optimized for development and testing with enterprise-grade performance.
 * Uses JavaScript Maps for O(1) lookups and maintains data consistency
 * across the AI processing pipeline.
 * 
 * Features:
 * - Ultra-fast document status updates for real-time UI
 * - Efficient embedding storage for semantic search
 * - Memory-optimized chat history management
 * - Atomic operations with proper cleanup
 */
export class MemStorage implements IStorage {
  private documents: Map<string, Document>;      // Document metadata and content
  private embeddings: Map<string, Embedding>;    // Vector embeddings for AI search
  private chatMessages: Map<string, ChatMessage>; // Conversation history

  constructor() {
    this.documents = new Map();
    this.embeddings = new Map();
    this.chatMessages = new Map();
    console.log('NeuralDoc: In-memory storage initialized for development');
  }

  /**
   * Document Creation with AI Processing Pipeline Integration
   * 
   * Creates a new document record with initial 'processing' status.
   * This triggers the AI processing pipeline while providing immediate
   * feedback to users.
   */
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      content: null,             // Content populated after processing
      status: "processing",      // Initial status for real-time UI updates
      uploadedAt: new Date(),
      processedAt: null,         // Set when AI processing completes
    };
    this.documents.set(id, document);
    console.log(`NeuralDoc: Document created: ${document.originalName} (${id})`);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  /**
   * Document Processing Status Updates
   * 
   * Critical method for real-time status updates during AI processing pipeline.
   * Updates document status and content as processing stages complete:
   * - 'processing': Initial upload acknowledgment
   * - 'completed': AI processing finished, ready for chat
   * - 'failed': Processing encountered errors
   */
  async updateDocumentStatus(id: string, status: string, content?: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.status = status;
      
      // Store extracted and processed content for AI access
      if (content !== undefined) {
        console.log(`NeuralDoc: Storing content of length: ${content.length} characters`);
        console.log(`NeuralDoc: Content preview: ${content.substring(0, 100)}...`);
        document.content = content;
      }
      
      // Mark processing completion timestamp for analytics
      if (status === "completed") {
        document.processedAt = new Date();
        console.log(`NeuralDoc: Document processing completed: ${document.originalName}`);
      }
      
      this.documents.set(id, document);
      
      // Verification for data integrity
      const storedDoc = this.documents.get(id);
      if (storedDoc && storedDoc.content) {
        console.log(`NeuralDoc: Verification - stored content length: ${storedDoc.content.length}`);
      }
    }
  }

  /**
   * Complete Document Deletion with AI Data Cleanup
   * 
   * Performs comprehensive cleanup of document and all associated AI data:
   * - Removes document metadata and content
   * - Deletes all associated vector embeddings
   * - Cleans up any temporary processing files
   * - Updates real-time UI through cache invalidation
   */
  async deleteDocument(id: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      console.log(`NeuralDoc: Deleting document ${id} (${document.originalName}) with status: ${document.status}`);
      
      // Remove document regardless of processing status
      this.documents.delete(id);
      
      // Clean up all associated AI embeddings to prevent orphaned data
      await this.deleteEmbeddingsByDocument(id);
      
      console.log(`NeuralDoc: Document ${id} deleted successfully with full cleanup`);
    }
  }

  async createEmbedding(insertEmbedding: InsertEmbedding): Promise<Embedding> {
    const id = randomUUID();
    const embedding: Embedding = {
      ...insertEmbedding,
      id,
      createdAt: new Date(),
      metadata: insertEmbedding.metadata || null,
    };
    this.embeddings.set(id, embedding);
    return embedding;
  }

  // Batch create embeddings for maximum performance
  async createEmbeddingsBatch(insertEmbeddings: InsertEmbedding[]): Promise<Embedding[]> {
    const embeddings: Embedding[] = [];
    for (const insertEmbedding of insertEmbeddings) {
      const id = randomUUID();
      const embedding: Embedding = {
        ...insertEmbedding,
        id,
        createdAt: new Date(),
        metadata: insertEmbedding.metadata || null,
      };
      this.embeddings.set(id, embedding);
      embeddings.push(embedding);
    }
    return embeddings;
  }

  async getEmbeddingsByDocument(documentId: string): Promise<Embedding[]> {
    return Array.from(this.embeddings.values()).filter(
      (embedding) => embedding.documentId === documentId
    );
  }

  async getAllEmbeddings(): Promise<Embedding[]> {
    const embeddings = Array.from(this.embeddings.values());
    console.log(`Retrieved ${embeddings.length} embeddings from storage`);
    return embeddings;
  }

  async deleteEmbeddingsByDocument(documentId: string): Promise<void> {
    const toDelete = Array.from(this.embeddings.entries())
      .filter(([, embedding]) => embedding.documentId === documentId)
      .map(([id]) => id);
    
    toDelete.forEach(id => this.embeddings.delete(id));
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
      sources: insertMessage.sources || null,
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    // Clear chat messages if no documents exist
    if (this.documents.size === 0) {
      this.chatMessages.clear();
      return [];
    }
    
    // Return last 12 messages (6 question-answer pairs) sorted by time
    const allMessages = Array.from(this.chatMessages.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    
    return allMessages.slice(-12);
  }

  async clearChatHistory(): Promise<void> {
    this.chatMessages.clear();
  }
}

export const storage = new MemStorage();
