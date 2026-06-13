import inquirer from 'inquirer';
import { UserInput } from './types';

export async function getUserInput(): Promise<UserInput> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'goal',
      message: '운동 목표를 선택하세요:',
      choices: [
        { name: '벌크업 (근육 증가)', value: '벌크업' },
        { name: '다이어트 (체중 감량)', value: '다이어트' },
        { name: '체력 유지 (현상 유지)', value: '체력유지' },
      ],
    },
    {
      type: 'list',
      name: 'experience',
      message: '운동 경험 수준을 선택하세요:',
      choices: [
        { name: '초보 (운동 경험 1년 미만)', value: '초보' },
        { name: '중급 (운동 경험 1-3년)', value: '중급' },
        { name: '고급 (운동 경험 3년 이상)', value: '고급' },
      ],
    },
    {
      type: 'list',
      name: 'days_per_week',
      message: '주당 운동 가능 일수를 선택하세요:',
      choices: [
        { name: '2일', value: 2 },
        { name: '3일', value: 3 },
        { name: '4일', value: 4 },
        { name: '5일', value: 5 },
        { name: '6일', value: 6 },
        { name: '7일', value: 7 },
      ],
    },
  ]);

  return answers as UserInput;
}
