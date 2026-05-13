import { Injectable } from '@nestjs/common';
import axios, { AxiosError, AxiosRequestConfig, Method } from 'axios';
import { JiraIntegrationEntity } from '../entities/jira-integration.entity';
import { JiraAuthType } from '../enums/jira-auth-type.enum';

type JiraRequestOptions = {
  method: Method;
  path: string;
  data?: unknown;
};

@Injectable()
export class JiraClientService {
  async getCurrentUser(integration: JiraIntegrationEntity): Promise<any> {
    return this.request(integration, { method: 'GET', path: '/myself' });
  }

  async getIssueTransitions(
    integration: JiraIntegrationEntity,
    issueKey: string,
  ): Promise<any[]> {
    const response = await this.request(integration, {
      method: 'GET',
      path: `/issue/${encodeURIComponent(issueKey)}/transitions`,
    });

    return response?.transitions || [];
  }

  async transitionIssue(
    integration: JiraIntegrationEntity,
    issueKey: string,
    transitionId: string,
  ): Promise<void> {
    await this.request(integration, {
      method: 'POST',
      path: `/issue/${encodeURIComponent(issueKey)}/transitions`,
      data: {
        transition: {
          id: transitionId,
        },
      },
    });
  }

  private async request(
    integration: JiraIntegrationEntity,
    options: JiraRequestOptions,
  ): Promise<any> {
    try {
      return await this.requestWithApiVersion(integration, '2', options);
    } catch (error) {
      if (this.isNotFound(error)) {
        return this.requestWithApiVersion(integration, '3', options);
      }
      throw error;
    }
  }

  private async requestWithApiVersion(
    integration: JiraIntegrationEntity,
    apiVersion: '2' | '3',
    options: JiraRequestOptions,
  ): Promise<any> {
    const config: AxiosRequestConfig = {
      method: options.method,
      url: `${this.normalizeDomain(integration.jiraDomain)}/rest/api/${apiVersion}${options.path}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.getAuthorizationHeader(integration),
      },
      data: options.data,
    };
    const response = await axios.request(config);
    return response.data;
  }

  private getAuthorizationHeader(integration: JiraIntegrationEntity): string {
    const token = integration.getDecryptedApiToken();

    if (integration.authType === JiraAuthType.BEARER) {
      return `Bearer ${token}`;
    }

    const credentials = Buffer.from(
      `${integration.jiraEmail}:${token}`,
    ).toString('base64');
    return `Basic ${credentials}`;
  }

  private normalizeDomain(domain: string): string {
    return domain.replace(/\/+$/, '');
  }

  private isNotFound(error: unknown): boolean {
    return error instanceof AxiosError && error.response?.status === 404;
  }
}
