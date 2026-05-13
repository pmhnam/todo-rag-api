import { ProjectEntity } from '@/api/project/entities/project.entity';
import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import * as crypto from 'crypto';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { JiraAuthType } from '../enums/jira-auth-type.enum';
import { JiraStatusMappingEntity } from './jira-status-mapping.entity';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.JIRA_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('JIRA_ENCRYPTION_KEY environment variable is not set');
  }
  // Key must be 32 bytes for AES-256
  return Buffer.from(key.padEnd(32).slice(0, 32));
}

function encryptToken(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(encrypted: string): string {
  const [ivHex, encryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString();
}

@Entity('jira_integration')
export class JiraIntegrationEntity extends AbstractEntity {
  constructor(data?: Partial<JiraIntegrationEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_jira_integration_id',
  })
  id!: Uuid;

  @Column({ name: 'jira_domain', length: 255 })
  jiraDomain!: string;

  @Column({ name: 'jira_email', length: 255, nullable: true })
  jiraEmail?: string;

  @Column({
    name: 'auth_type',
    type: 'enum',
    enum: JiraAuthType,
    default: JiraAuthType.BASIC,
  })
  authType!: JiraAuthType;

  @Column({ name: 'jira_api_token' })
  jiraApiToken!: string;

  @Column({ name: 'jira_project_key', length: 50, nullable: true })
  jiraProjectKey?: string;

  @Column({ name: 'user_id' })
  userId!: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_jira_integration_user_id',
  })
  @ManyToOne(() => UserEntity, (user) => user.jiraIntegrations)
  user: Relation<UserEntity>;

  @Index('UQ_jira_integration_project_id', { unique: true })
  @Column({ name: 'project_id' })
  projectId!: Uuid;

  @JoinColumn({
    name: 'project_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_jira_integration_project_id',
  })
  @ManyToOne(() => ProjectEntity)
  project: Relation<ProjectEntity>;

  @OneToMany(
    () => JiraStatusMappingEntity,
    (mapping) => mapping.jiraIntegration,
  )
  statusMappings: Relation<JiraStatusMappingEntity[]>;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  encryptApiToken() {
    // Only encrypt if the value is not already encrypted (doesn't contain ':')
    if (this.jiraApiToken && !this.jiraApiToken.includes(':')) {
      this.jiraApiToken = encryptToken(this.jiraApiToken);
    }
  }

  getDecryptedApiToken(): string {
    return decryptToken(this.jiraApiToken);
  }
}
