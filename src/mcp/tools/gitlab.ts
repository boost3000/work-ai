import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GitLabClient } from '../../tools/gitlab/client.ts';

export function registerGitLabTools(server: McpServer, gitlab: GitLabClient): void {
    server.registerTool(
        'gitlab_list_projects',
        {
            description: 'List GitLab projects you have access to. Optionally search by name.',
            inputSchema: {
                search: z.string().optional().describe('Optional search query to filter projects by name'),
                limit: z.number().optional().describe('Max results (default 20)'),
            },
        },
        async ({ search, limit }) => {
            const projects = await gitlab.listProjects(search, limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        projects.map((p) => ({
                            id: p.id,
                            name: p.name,
                            path: p.path_with_namespace,
                            description: p.description,
                            defaultBranch: p.default_branch,
                            lastActivity: p.last_activity_at,
                        })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_get_project',
        {
            description: 'Get details of a GitLab project by ID or URL-encoded path (e.g. "group%2Fproject").',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
            },
        },
        async ({ projectId }) => {
            const project = await gitlab.getProject(projectId);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        {
                            id: project.id,
                            name: project.name,
                            path: project.path_with_namespace,
                            description: project.description,
                            defaultBranch: project.default_branch,
                            webUrl: project.web_url,
                            lastActivity: project.last_activity_at,
                        },
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_get_tree',
        {
            description: 'List files and directories in a GitLab repository path.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                path: z.string().optional().describe('Directory path (default: root)'),
                ref: z.string().optional().describe('Branch or tag (default: project default branch)'),
                limit: z.number().optional().describe('Max results (default 100)'),
            },
        },
        async ({ projectId, path, ref, limit }) => {
            const items = await gitlab.getTree(projectId, path, ref, limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(items.map((i) => ({ type: i.type, path: i.path, name: i.name })), null, 2),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_get_file',
        {
            description: 'Read the content of a file from a GitLab repository.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                filePath: z.string().describe('Path to the file in the repository'),
                ref: z.string().optional().describe('Branch or tag (default: project default branch)'),
            },
        },
        async ({ projectId, filePath, ref }) => {
            const file = await gitlab.getFile(projectId, filePath, ref);
            return { content: [{ type: 'text', text: file.content }] };
        },
    );

    server.registerTool(
        'gitlab_list_merge_requests',
        {
            description: 'List merge requests for a GitLab project.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                state: z.enum(['opened', 'closed', 'merged', 'all']).optional().describe('Filter by state (default: opened)'),
                limit: z.number().optional().describe('Max results (default 20)'),
            },
        },
        async ({ projectId, state, limit }) => {
            const mrs = await gitlab.listMergeRequests(projectId, state, limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        mrs.map((mr) => ({
                            iid: mr.iid,
                            title: mr.title,
                            state: mr.state,
                            author: mr.author.username,
                            sourceBranch: mr.source_branch,
                            targetBranch: mr.target_branch,
                            updatedAt: mr.updated_at,
                            webUrl: mr.web_url,
                        })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_get_merge_request',
        {
            description: 'Get full details of a single merge request including description, reviewers, and labels.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                mrIid: z.number().describe('The MR internal ID (iid)'),
            },
        },
        async ({ projectId, mrIid }) => {
            const mr = await gitlab.getMergeRequest(projectId, mrIid);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        {
                            iid: mr.iid,
                            title: mr.title,
                            state: mr.state,
                            description: mr.description,
                            author: mr.author.username,
                            sourceBranch: mr.source_branch,
                            targetBranch: mr.target_branch,
                            createdAt: mr.created_at,
                            updatedAt: mr.updated_at,
                            webUrl: mr.web_url,
                        },
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_get_merge_request_diff',
        {
            description: 'Get the file diffs of a merge request.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                mrIid: z.number().describe('The MR internal ID (iid)'),
            },
        },
        async ({ projectId, mrIid }) => {
            const diffs = await gitlab.getMergeRequestDiff(projectId, mrIid);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        diffs.map((d) => ({
                            oldPath: d.old_path,
                            newPath: d.new_path,
                            newFile: d.new_file,
                            deletedFile: d.deleted_file,
                            renamedFile: d.renamed_file,
                            diff: d.diff,
                        })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_get_merge_request_comments',
        {
            description: 'Get comments/notes on a merge request.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                mrIid: z.number().describe('The MR internal ID (iid)'),
                limit: z.number().optional().describe('Max results (default 50)'),
            },
        },
        async ({ projectId, mrIid, limit }) => {
            const notes = await gitlab.getMergeRequestComments(projectId, mrIid, limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        notes
                            .filter((n) => !n.system)
                            .map((n) => ({
                                id: n.id,
                                author: n.author.username,
                                body: n.body,
                                createdAt: n.created_at,
                                resolvable: n.resolvable,
                                resolved: n.resolved,
                            })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_add_mr_comment',
        {
            description: 'Post a comment on a GitLab merge request.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                mrIid: z.number().describe('The MR internal ID (iid)'),
                body: z.string().describe('Comment text'),
            },
        },
        async ({ projectId, mrIid, body }) => {
            const note = await gitlab.addMergeRequestComment(projectId, mrIid, body);
            return { content: [{ type: 'text', text: `Comment posted (id: ${note.id}) on MR !${mrIid}.` }] };
        },
    );

    server.registerTool(
        'gitlab_list_branches',
        {
            description: 'List branches in a GitLab repository.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                search: z.string().optional().describe('Optional search string to filter branches'),
                limit: z.number().optional().describe('Max results (default 50)'),
            },
        },
        async ({ projectId, search, limit }) => {
            const branches = await gitlab.listBranches(projectId, search, limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        branches.map((b) => ({
                            name: b.name,
                            default: b.default,
                            protected: b.protected,
                            merged: b.merged,
                            lastCommit: b.commit.title,
                            committedAt: b.commit.committed_date,
                        })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_create_branch',
        {
            description: 'Create a new branch in a GitLab repository.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                branchName: z.string().describe('Name of the new branch'),
                ref: z.string().describe('Source branch or commit SHA (e.g. "main")'),
            },
        },
        async ({ projectId, branchName, ref }) => {
            await gitlab.createBranch(projectId, branchName, ref);
            return {
                content: [{
                    type: 'text',
                    text: `Created branch '${branchName}' from '${ref}' in project ${projectId}.`,
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_delete_branch',
        {
            description: 'Delete a branch from a GitLab repository.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                branchName: z.string().describe('Name of the branch to delete'),
            },
        },
        async ({ projectId, branchName }) => {
            await gitlab.deleteBranch(projectId, branchName);
            return { content: [{ type: 'text', text: `Branch '${branchName}' deleted from project ${projectId}.` }] };
        },
    );

    server.registerTool(
        'gitlab_list_commits',
        {
            description: 'List recent commits in a GitLab repository, optionally filtered by branch.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                ref: z.string().optional().describe('Branch or tag name (default: project default branch)'),
                limit: z.number().optional().describe('Max results (default 20)'),
            },
        },
        async ({ projectId, ref, limit }) => {
            const commits = await gitlab.listCommits(projectId, ref, limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        commits.map((c) => ({
                            id: c.short_id,
                            title: c.title,
                            author: c.author_name,
                            date: c.authored_date,
                            webUrl: c.web_url,
                        })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_create_commit',
        {
            description: 'Create a commit with one or more file changes.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                branch: z.string().describe('Branch to commit to'),
                message: z.string().describe('Commit message'),
                actions: z.array(z.object({
                    action: z.enum(['create', 'delete', 'move', 'update']),
                    file_path: z.string(),
                    content: z.string().optional().describe('Content for create/update actions'),
                    previous_path: z.string().optional().describe('Required for move action'),
                })).describe('List of file actions (create, delete, move, update)'),
            },
        },
        async ({ projectId, branch, message, actions }) => {
            await gitlab.createCommit(projectId, branch, message, actions);
            return { content: [{ type: 'text', text: `Created commit on branch '${branch}' in project ${projectId}.` }] };
        },
    );

    server.registerTool(
        'gitlab_create_merge_request',
        {
            description: 'Create a new merge request.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                sourceBranch: z.string().describe('The source branch'),
                targetBranch: z.string().describe('The target branch'),
                title: z.string().describe('Title of the MR'),
                description: z.string().optional().describe('Description of the MR'),
            },
        },
        async ({ projectId, sourceBranch, targetBranch, title, description }) => {
            const mr = await gitlab.createMergeRequest(projectId, sourceBranch, targetBranch, title, description);
            return { content: [{ type: 'text', text: JSON.stringify(mr, null, 2) }] };
        },
    );

    server.registerTool(
        'gitlab_update_merge_request',
        {
            description: 'Update an existing merge request (title, description, target branch, assignee).',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                mrIid: z.number().describe('The MR internal ID (iid)'),
                title: z.string().optional().describe('New title'),
                description: z.string().optional().describe('New description'),
                targetBranch: z.string().optional().describe('New target branch'),
                assigneeId: z.number().optional().describe('New assignee user ID'),
            },
        },
        async ({ projectId, mrIid, title, description, targetBranch, assigneeId }) => {
            const mr = await gitlab.updateMergeRequest(projectId, mrIid, {
                title,
                description,
                target_branch: targetBranch,
                assignee_id: assigneeId,
            });
            return { content: [{ type: 'text', text: JSON.stringify({ iid: mr.iid, title: mr.title, web_url: mr.web_url }, null, 2) }] };
        },
    );

    server.registerTool(
        'gitlab_list_pipelines',
        {
            description: 'List CI/CD pipelines for a GitLab project.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                ref: z.string().optional().describe('Filter by branch or tag name'),
                status: z.string().optional().describe(
                    'Filter by status: created, waiting_for_resource, preparing, pending, running, success, failed, canceled, skipped, manual, scheduled',
                ),
                limit: z.number().optional().describe('Max results (default 20)'),
            },
        },
        async ({ projectId, ref, status, limit }) => {
            const pipelines = await gitlab.listPipelines(projectId, ref, status, limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        pipelines.map((p) => ({
                            id: p.id,
                            status: p.status,
                            ref: p.ref,
                            sha: p.sha,
                            createdAt: p.created_at,
                            updatedAt: p.updated_at,
                            webUrl: p.web_url,
                        })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_get_pipeline_jobs',
        {
            description: 'List jobs for a specific pipeline.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                pipelineId: z.number().describe('Pipeline ID'),
            },
        },
        async ({ projectId, pipelineId }) => {
            const jobs = await gitlab.getPipelineJobs(projectId, pipelineId);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        jobs.map((j) => ({
                            id: j.id,
                            name: j.name,
                            stage: j.stage,
                            status: j.status,
                            duration: j.duration,
                            webUrl: j.web_url,
                        })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_get_job_log',
        {
            description: 'Get the full log output of a CI/CD job.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                jobId: z.number().describe('Job ID'),
            },
        },
        async ({ projectId, jobId }) => {
            const log = await gitlab.getJobLog(projectId, jobId);
            return { content: [{ type: 'text', text: log }] };
        },
    );

    server.registerTool(
        'gitlab_trigger_pipeline',
        {
            description: 'Trigger a new CI/CD pipeline for a branch or tag.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                ref: z.string().describe('Branch or tag to run the pipeline on'),
            },
        },
        async ({ projectId, ref }) => {
            const pipeline = await gitlab.triggerPipeline(projectId, ref);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ id: pipeline.id, status: pipeline.status, webUrl: pipeline.web_url }, null, 2),
                }],
            };
        },
    );

    server.registerTool(
        'gitlab_retry_job',
        {
            description: 'Retry a failed or cancelled CI/CD job.',
            inputSchema: {
                projectId: z.string().describe('Project ID or URL-encoded path'),
                jobId: z.number().describe('Job ID'),
            },
        },
        async ({ projectId, jobId }) => {
            const job = await gitlab.retryJob(projectId, jobId);
            return { content: [{ type: 'text', text: `Job ${job.id} (${job.name}) retried. Status: ${job.status}.` }] };
        },
    );
}
