import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

export class SnakeCaseNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(className: string, customName?: string): string {
    if (customName) {
      return customName;
    }

    const snakeCaseName = this.toSnakeCase(className);

    if (snakeCaseName.endsWith('s')) {
      return snakeCaseName;
    }

    if (snakeCaseName.endsWith('y') && !/[aeiou]y$/.test(snakeCaseName)) {
      return snakeCaseName.slice(0, -1) + 'ies';
    }

    if (
      snakeCaseName.endsWith('ch') ||
      snakeCaseName.endsWith('sh') ||
      snakeCaseName.endsWith('x') ||
      snakeCaseName.endsWith('z')
    ) {
      return snakeCaseName + 'es';
    }

    return snakeCaseName + 's';
  }

  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    const prefix = embeddedPrefixes.length
      ? embeddedPrefixes.map((p) => this.toSnakeCase(p)).join('_') + '_'
      : '';
    return prefix + this.toSnakeCase(customName ? customName : propertyName);
  }

  relationName(propertyName: string): string {
    return this.toSnakeCase(propertyName);
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}
