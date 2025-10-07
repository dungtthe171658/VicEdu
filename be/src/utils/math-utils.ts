import BN, {BigNumber} from "bignumber.js";

BigNumber.set({EXPONENTIAL_AT: 40});

export class MathUtils {
    public static getBN(t: string | number | BigNumber) {
        return new BN(t);
    }

    public static toNumber(t?: string | number | BigNumber) {
        if (t == null) {
            return new BN(0);
        }
        return typeof t === "string" ? new BN(t) : new BN(t.toString());
    }

    public static isPositive(t: any) {
        const b = typeof t === "string" ? this.getBN(t) : t;
        return !b.isZero() && b.isPositive();
    }

    public static isLessThan(
        numberA: string | number | BigNumber,
        numberB: string | number | BigNumber
    ) {
        const bnA = this.getBN(numberA);
        const bnB = this.getBN(numberB);
        return bnA.isLessThan(bnB);
    }

    public static isGreaterThan(
        numberA: string | number | BigNumber,
        numberB: string | number | BigNumber
    ) {
        const bnA = this.getBN(numberA);
        const bnB = this.getBN(numberB);
        return bnA.isGreaterThan(bnB);
    }

    public static isEqual(
        numberA: string | number | BigNumber,
        numberB: string | number | BigNumber
    ) {
        const bnA = this.getBN(numberA);
        const bnB = this.getBN(numberB);
        return bnA.isEqualTo(bnB);
    }

    public static mul(
        numberA: string | number | BigNumber,
        numberB: string | number | BigNumber
    ) {
        const bnA = this.getBN(numberA);
        const bnB = this.getBN(numberB);
        return bnA.multipliedBy(bnB).toString();
    }

    public static plus(
        numberA: string | number | BigNumber,
        numberB: string | number | BigNumber
    ) {
        const bnA = this.getBN(numberA);
        const bnB = this.getBN(numberB);
        return bnA.plus(bnB).toString();
    }

    public static minus(
        numberA: string | number | BigNumber,
        numberB: string | number | BigNumber
    ) {
        const bnA = this.getBN(numberA);
        const bnB = this.getBN(numberB);
        return bnA.minus(bnB).toString();
    }

    public static div(
        numberA: string | number | BigNumber,
        numberB: string | number | BigNumber
    ) {
        const bnA = this.getBN(numberA);
        const bnB = this.getBN(numberB);
        return bnA.dividedBy(bnB).toString();
    }

    public static isLessThanOrEqual(
        numberA: string | number | BigNumber,
        numberB: string | number | BigNumber
    ) {
        const bnA = this.getBN(numberA);
        const bnB = this.getBN(numberB);
        return bnA.isLessThanOrEqualTo(bnB);
    }

    public static isGreaterThanOrEqual(
        numberA: string | number | BigNumber,
        numberB: string | number | BigNumber
    ) {
        const bnA = this.getBN(numberA);
        const bnB = this.getBN(numberB);
        return bnA.isGreaterThanOrEqualTo(bnB);
    }
}
