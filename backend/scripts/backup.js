#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config();

class DatabaseBackup {
  constructor() {
    this.backupPath = process.env.BACKUP_PATH || './backups';
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
    
    // Configure AWS S3 if credentials are provided
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      this.s3Bucket = process.env.AWS_S3_BUCKET;
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.backupPath, filename);
    
    console.log(`🔄 Creating database backup: ${filename}`);
    
    return new Promise((resolve, reject) => {
      const pgDump = exec(`pg_dump "${process.env.DATABASE_URL}" > "${filepath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Backup failed: ${error.message}`);
          reject(error);
          return;
        }
        
        console.log(`✅ Backup created successfully: ${filepath}`);
        resolve(filepath);
      });
    });
  }

  async compressBackup(filepath) {
    const compressedPath = `${filepath}.gz`;
    
    console.log(`🗜️ Compressing backup...`);
    
    return new Promise((resolve, reject) => {
      const gzip = exec(`gzip "${filepath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Compression failed: ${error.message}`);
          reject(error);
          return;
        }
        
        console.log(`✅ Backup compressed: ${compressedPath}`);
        resolve(compressedPath);
      });
    });
  }

  async uploadToS3(filepath) {
    if (!this.s3 || !this.s3Bucket) {
      console.log('⚠️ S3 not configured, skipping upload');
      return null;
    }
    
    const filename = path.basename(filepath);
    console.log(`☁️ Uploading to S3: ${filename}`);
    
    try {
      const fileContent = fs.readFileSync(filepath);
      const uploadParams = {
        Bucket: this.s3Bucket,
        Key: `backups/${filename}`,
        Body: fileContent,
        ContentType: 'application/gzip',
        Metadata: {
          'backup-date': new Date().toISOString(),
          'environment': process.env.NODE_ENV || 'production'
        }
      };
      
      const result = await this.s3.upload(uploadParams).promise();
      console.log(`✅ Uploaded to S3: ${result.Location}`);
      return result.Location;
    } catch (error) {
      console.error(`❌ S3 upload failed: ${error.message}`);
      throw error;
    }
  }

  async cleanupOldBackups() {
    console.log(`🧹 Cleaning up backups older than ${this.retentionDays} days...`);
    
    const files = fs.readdirSync(this.backupPath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filepath = path.join(this.backupPath, file);
      const stats = fs.statSync(filepath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filepath);
        console.log(`🗑️ Deleted old backup: ${file}`);
        deletedCount++;
      }
    }
    
    console.log(`✅ Cleaned up ${deletedCount} old backups`);
  }

  async cleanupOldS3Backups() {
    if (!this.s3 || !this.s3Bucket) {
      return;
    }
    
    console.log('🧹 Cleaning up old S3 backups...');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      const listParams = {
        Bucket: this.s3Bucket,
        Prefix: 'backups/'
      };
      
      const objects = await this.s3.listObjectsV2(listParams).promise();
      const oldObjects = objects.Contents.filter(obj => 
        new Date(obj.LastModified) < cutoffDate
      );
      
      if (oldObjects.length > 0) {
        const deleteParams = {
          Bucket: this.s3Bucket,
          Delete: {
            Objects: oldObjects.map(obj => ({ Key: obj.Key }))
          }
        };
        
        await this.s3.deleteObjects(deleteParams).promise();
        console.log(`✅ Deleted ${oldObjects.length} old S3 backups`);
      }
    } catch (error) {
      console.error(`❌ S3 cleanup failed: ${error.message}`);
    }
  }

  async runFullBackup() {
    try {
      console.log('🚀 Starting full backup process...');
      
      // Create backup
      const backupPath = await this.createBackup();
      
      // Compress backup
      const compressedPath = await this.compressBackup(backupPath);
      
      // Upload to S3
      await this.uploadToS3(compressedPath);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      await this.cleanupOldS3Backups();
      
      console.log('🎉 Full backup process completed successfully!');
      
      // Log backup completion
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'backup',
        status: 'success',
        file: path.basename(compressedPath),
        size: fs.statSync(compressedPath).size
      };
      
      fs.appendFileSync(
        path.join(this.backupPath, 'backup.log'),
        JSON.stringify(logEntry) + '\n'
      );
      
    } catch (error) {
      console.error('❌ Backup process failed:', error.message);
      
      // Log backup failure
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'backup',
        status: 'failed',
        error: error.message
      };
      
      fs.appendFileSync(
        path.join(this.backupPath, 'backup.log'),
        JSON.stringify(logEntry) + '\n'
      );
      
      process.exit(1);
    }
  }

  async restoreBackup(backupFile) {
    console.log(`🔄 Restoring from backup: ${backupFile}`);
    
    return new Promise((resolve, reject) => {
      const pgRestore = exec(`psql "${process.env.DATABASE_URL}" < "${backupFile}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Restore failed: ${error.message}`);
          reject(error);
          return;
        }
        
        console.log(`✅ Restore completed successfully`);
        resolve();
      });
    });
  }
}

// CLI interface
const backup = new DatabaseBackup();

if (process.argv.includes('--restore') && process.argv[3]) {
  backup.restoreBackup(process.argv[3]);
} else {
  backup.runFullBackup();
}

module.exports = DatabaseBackup; 