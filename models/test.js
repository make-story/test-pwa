module.exports = (Sequelize, sequelize) => {
	const boards = sequelize.define(
		'boards', // 테이블 이름
		{
			// 스키마 정의
			id: {
				type: Sequelize.INTEGER(11).UNSIGNED,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			name: {
				type: Sequelize.STRING(100),
				allowNull: false
			},
			content: {
				type: Sequelize.TEXT,
				allowNull: false
			},
			created_at: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.fn('now'),
				allowNull: false
			}
		},
		{
			// 테이블 옵션
			timestamps: true,
			underscored: true,
			paranoid: true
		}
	);

	// sync() 메서드를 사용하면 해당 모델의 테이블이 없다면 직접 테이블을 만들어 준다.
	boards.sync();
	return { boards, };
};