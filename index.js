const core = require('@actions/core');
const github = require('@actions/github');

require('dotenv').config()

let myToken = "";

if (process.env.TOKEN)
{
    myToken = process.env.TOKEN;
}
else
{
    myToken = core.getInput('github-token');
}

let refToSearch = "";

if (process.env.refToSearch)
{
    refToSearch = process.env.refToSearch;
}
else
{
    refToSearch = core.getInput('ref');
}

let envName = "";

if (process.env.envName)
{
    envName = process.env.envName;
}
else
{
    envName = core.getInput('environment');
}

let status = "";

if (process.env.status)
{
    status = process.env.status;
}
else
{
    status = core.getInput('status');
}

const owner = core.getInput('owner', {required: false}) || github.context.repo.owner
const repo = core.getInput('repo', {required: false}) || github.context.repo.repo


async function listDeployments(refTag, envName)
{
    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    //const myToken = core.getInput('myToken');

    const octokit = github.getOctokit(myToken)

    try
    {
        //Check if deployment exists
        const { data: deployments } = await octokit.rest.repos.listDeployments({
            owner: owner,
            repo: repo,
            environment: envName,
            ref: refTag
        })

        return deployments;
    }
    catch(error)
    {
        // Handle the promise
        console.log("ERROR listing Deployments: " + error.message)
        return false;
    };

}

async function getDeployments(envName)
{
    console.log(`
    Search Criteria
        Repo: ${owner}/${repo}
        Ref: ${refToSearch}
        Environment: ${envName}
        Status: ${status}
    `)

    let deployments = await listDeployments(refToSearch, envName);
    if (deployments.length > 0) {
        let deployment = deployments[0]
        console.log(`For owner ` + owner)
        console.log(`For repo ` + repo)
        console.log('For environment ' + deployment.environment)
        const deploymentId = deployment.id
        const deploymentCreatedAt = deployment.created_at
        const deploymentUpdatedAt = deployment.updated_at
        console.log('For ref ' + deployment.ref)
        console.log("Deployment ID: " + deploymentId)
        console.log("Created at: " + deploymentCreatedAt)
        console.log("Updated at: " + deploymentUpdatedAt)

        console.log('With status ' + status)
        if (status === "") {
            console.log('Output deployment id ' + deploymentId)
            core.setOutput("id", deploymentId);
        }
        else {
            const { data: statuses }  = await github.getOctokit(myToken).repos.listDeploymentStatuses({
                owner: owner,
                repo: repo,
                deployment_id: deployment.id
            })
            console.log('Statuses length ' + statuses.length)
            if (statuses.length > 0) {
                let deployment_status = statuses[0].state
                console.log('Current status ' + deployment_status)
                if (status == deployment_status) {
                    console.log('Output deployment id ' + deploymentId)
                    core.setOutput("id", deploymentId);
                }
            }
        }
    }
}

getDeployments(envName);
