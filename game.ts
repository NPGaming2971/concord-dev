import { compact } from 'lodash';

type CalculateOptions = {
	stat: PlayerStat;
	target: PlayerStat;
	skill?: object;
};
type Turn = 0 | 1;
interface PlayerStat {
	Health: number;
	Attack: number;
	HitRate: number;
	Reflect: number;
	Defense: number;
	Rates: {
		Critical: number;
		Fatal: number;
		FatalHead: number;
		FatalArms: number;
		FatalLegs: number;
	};
	Stamina: number;
	Skills: string[];
	Effects: string[];
}

interface Effect {
	id: string;
	type: 'buff' | 'debuff';
	value: number;
	valueType: 'percentage' | 'flat';
	affectedValue: string;
}

const PlayerStats: { [key in Turn]: PlayerStat } = {
	0: {
		Health: 2205,
		Attack: 999,
		HitRate: 50,
		Reflect: 2,
		Defense: 200,
		Rates: {
			Critical: 0,
			Fatal: 2,
			FatalHead: 20,
			FatalArms: 40,
			FatalLegs: 40
		},
		Stamina: 0,
		Skills: [],
		Effects: ['amplify', 'weaken']
	},
	1: {
		Health: 1020,
		Attack: 300,
		HitRate: 100,
		Reflect: 45,
		Defense: 200,
		Rates: {
			Critical: 100,
			Fatal: 2,
			FatalHead: 20,
			FatalArms: 40,
			FatalLegs: 40
		},
		Stamina: 0,
		Skills: [],
		Effects: ['amplify', 'weaken']
	}
};

const Effects: Effect[] = [
	{
		id: 'amplify',
		type: 'buff',
		value: 300,
		valueType: 'flat',
		affectedValue: 'Attack'
	},
	{
		id: 'weaken',
		type: 'debuff',
		value: 30,
		valueType: 'percentage',
		affectedValue: 'Attack'
	}
];

let turn: Turn = 1;
function calculateTurn(turn: Turn, PlayerStats: { [key in Turn]: PlayerStat }) {
	const Attacker = PlayerStats[turn];
	const Target = PlayerStats[turn ? 0 : 1];

	if (!calculateHitRate({ target: Target, stat: Attacker })) return 'Missed';

	let damage = Number(Attacker.Attack);

	console.log('Pure Damage:', damage);

	damage += calculateAttackBuff({ stat: Attacker, target: Target });

	const minimumDamage = Math.floor(percentageOf(5, damage));

	damage -= calculateAttackDebuff({ stat: Attacker, target: Target });

	console.log('Minimum damage:', minimumDamage);

	console.log('Reflected damage:', Math.floor(percentageOf(Target.Reflect, damage)));
	damage -= Math.floor(percentageOf(Target.Reflect, damage));

	damage = damage < minimumDamage ? minimumDamage : damage;

	console.log('Damage:', damage);

	return preventZero(Target.Health - damage);
}

function calculateHitRate(options: CalculateOptions) {
	const { stat, target } = options;
	return probability(stat.HitRate - target.Reflect);
}

function calculateAttackBuff(options: CalculateOptions) {
	const { stat } = options;

	let baseDamage = Number(stat.Attack);
	let buffedDamage = 0;

	if (probability(stat.Rates.Critical)) buffedDamage += percentageOf(50, baseDamage);
	const appliedEffect = compact(stat.Effects.map((i) => Effects.find((e) => e.id === i && e.affectedValue === 'Attack' && e.type === 'buff') ?? null));
	
	for (const effect of appliedEffect) {
		if (effect.valueType === 'flat') {
			buffedDamage += effect.value;
		} else if (effect.valueType === 'percentage') {
			buffedDamage += percentageOf(effect.value, baseDamage);
		}
	}
	console.log('Buffed damage:', buffedDamage);

	return preventZero(Math.floor(buffedDamage));
}

function calculateAttackDebuff(options: CalculateOptions) {
	const { stat, target } = options;

	let baseDamage = Number(stat.Attack);
	let debuffedDamage = 0;

	let appliedEffect = stat.Effects.map((i) => Effects.find((e) => e.id === i && e.affectedValue === 'Attack' && e.type === 'debuff') ?? null);

	for (const effect of compact(appliedEffect)) {
		if (effect.valueType === 'flat') {
			debuffedDamage += effect.value;
		} else if (effect.valueType === 'percentage') {
			debuffedDamage += percentageOf(effect.value, baseDamage);
		}
	}

	debuffedDamage = Math.floor(debuffedDamage) + target.Defense;

	console.log('Debuffed damage:', debuffedDamage);

	return preventZero(Math.floor(debuffedDamage));
}

function probability(n: number) {
	n = n / 100;
	return !!n && Math.random() <= n;
}

function percentageOf(num: number, amount: number) {
	return (num * amount) / 100;
}

function preventZero(n: number) {
	return n < 0 ? 0 : n;
}

console.log('Health:', calculateTurn(turn, PlayerStats));
