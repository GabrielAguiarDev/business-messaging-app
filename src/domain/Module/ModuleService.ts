import {moduleAdapter} from './ModuleAdapter';
import {moduleApi} from './ModuleApi';
import {Module, ModuleContent} from './ModuleTypes';

async function getModules(): Promise<Module[]> {
  const modules = await moduleApi.getModules();
  return modules.map(moduleAdapter.toModule);
}

async function getModuleContent(moduleId: string): Promise<ModuleContent> {
  const content = await moduleApi.getModuleContent(moduleId);
  return moduleAdapter.toModuleContent(content);
}

export const moduleService = {getModules, getModuleContent};
